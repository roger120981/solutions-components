/** @license
 * Copyright 2022 Esri
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 | Helper functions from solutions-common
*/

import {
  convertItemResourceToStorageResource,
  EFileType,
  IItemUpdate,
  updateItem,
  UserSession,
  SolutionTemplateFormatVersion
} from "@esri/solution-common";
import { EUpdateType, IResourcePath, IResponse, ISolutionModel, ISolutionModels } from "./interfaces";
import {
  addItemResource,
  IItemResourceOptions,
  removeItemResource,
  updateItemResource
} from "@esri/arcgis-rest-portal";

/**
 * Get an array from a list of nodes
 *
 * @param nodeList list of nodes
 *
 * @returns array of nodes
 */
export function nodeListToArray<T extends Element>(nodeList: HTMLCollectionOf<T> | NodeListOf<T> | T[]): T[] {
  return Array.isArray(nodeList) ? nodeList : Array.from(nodeList);
}

/**
 * Saves any updated templates to the current solution item
 *
 * @param templates the updated templates array
 * @param thumbnailurl url for the items thumbnail
 * @param id for the solution item
 * @param data the current solution items data
 * @param authentication credentials for the request
 * @param translations translated strings for messages
 *
 * @returns a promise that will resolve with a success true/false response
 */
export async function save(
  id: string,
  data: any,
  models: ISolutionModels,
  authentication: UserSession,
  translations: any
): Promise<IResponse> {

  const itemInfo: IItemUpdate = { id };

  const params: any = {
    text: data
  };

  await _updateResources(id, models, data, authentication);

  // TODO compare data with the source data in the model...should be able to
  // understand if it has changes
  // TODO...only update if has changes
  const updateResults = await updateItem(
    itemInfo,
    authentication,
    undefined,
    params
  );

  return Promise.resolve({
    success: updateResults.success,
    message: updateResults.success ? translations.editsSaved : translations.saveFailed
  });
}

/**
 * Updates the solutions thumbnail and data resources
 *
 * @param solutionId id for the solution
 * @param models the models for the solutions templates
 * @param data the current data object for the solution
 * @param authentication credentials for the request
 *
 * @returns a promise that will resolve with response results
 */
export async function _updateResources(
  solutionId: string,
  models: ISolutionModels,
  data: any,
  authentication: UserSession
): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    const promises = [];
    Object.keys(models).forEach(itemId => {
      const model: ISolutionModel = models[itemId];
      promises.push(_updateThumbnailResource(
        solutionId,
        model,
        data,
        authentication
      ));
      _updateFileResources(
        solutionId,
        model,
        data,
        promises,
        authentication
      );
    });
    if (promises.length > 0) {
      Promise.all(promises).then(resolve, reject);
    } else {
      resolve({success: true})
    }
  })
}

/**
 * Updates the solutions thumbnail and data resources
 *
 * @param solutionId id for the solution
 * @param model the model for the current solution template
 * @param authentication credentials for the request
 *
 * @returns a promise that will resolve with response results
 */
function _updateThumbnailResource(
  solutionId: string,
  model: ISolutionModel,
  data: any,
  authentication: UserSession
): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    if (model.thumbnailNew) {
      if (model.thumbnailOrigin) {
        const name: string = model.thumbnailOrigin.name;

        const opts: IItemResourceOptions = {
          id: solutionId,
          authentication,
          resource: model.thumbnailNew,
          name
        };

        const resources = model.resources.filter(r => r.endsWith(name));
        if (resources.length === 1) {
          const nameParts = resources[0].split("/");
          if (nameParts.length === 2) {
            opts.prefix = nameParts[0];
          }
        }
        updateItemResource(opts).then(resolve, reject);
      } else {
        // if the item does not have an origin thumb we need to add rather than update
        const resourceFilePath: IResourcePath = {
          type: EFileType.Thumbnail,
          folder: null,
          filename: model.thumbnailNew.name,
          url: "",
          blob: model.thumbnailNew,
          updateType: EUpdateType.Add
        };

        _add(solutionId, model, data, resourceFilePath, authentication, true).then(resolve, reject);
      }
    } else {
      resolve({success: true});
    }
  });
}

/**
 * Updates the solutions data resources
 *
 * This function will update the provided promises argument by adding add/remove/update promises
 *
 * @param solutionId id for the solution
 * @param model the model for the current solution template
 * @param data the current data object for the solution
 * @param promises list of add/remove/update promises
 * @param authentication credentials for the request
 */
function _updateFileResources(
  solutionId: string,
  model: ISolutionModel,
  data: any,
  promises: Promise<any>[],
  authentication: UserSession
): void {
  // add/remove/update resources
  model.resourceFilePaths.forEach(resourceFilePath => {
    switch (resourceFilePath.updateType) {
      case EUpdateType.Add:
        promises.push(_add(
          solutionId,
          model,
          data,
          resourceFilePath,
          authentication
        ));
        break;

      case EUpdateType.Remove:
        promises.push(_remove(
          solutionId,
          model,
          data,
          resourceFilePath,
          authentication
        ));
        break;

      case EUpdateType.Update:
        promises.push(_update(
          solutionId,
          model,
          resourceFilePath,
          authentication
        ));
        break;

      default:
        break;
    }
  });
}

/**
 * Generates add resource request
 *
 * @param solutionId id for the solution
 * @param model the model for the current solution template
 * @param data the current data object for the solution
 * @param resourceFilePath resource file info
 * @param authentication credentials for the request
 *
 * @returns a promise that will resolve to a response with success true/false
 */
function _add(
  solutionId: string,
  model: ISolutionModel,
  data: any,
  resourceFilePath: IResourcePath,
  authentication: UserSession,
  isThumbnail = false
): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    const storageName = convertItemResourceToStorageResource(
      model.itemId + isThumbnail.toString() ? "_info_thumbnail" :
        ((resourceFilePath.blob as File).name === resourceFilePath.filename
          ? "_info_data"
          : "_info_dataz"),
      (resourceFilePath.blob as File).name,
      SolutionTemplateFormatVersion
    );

    const opts: IItemResourceOptions = {
      id: solutionId,
      authentication,
      resource: resourceFilePath.blob,
      name: storageName.filename,
      params: {}
    };

    if (storageName.folder) {
      opts.params = {
        resourcesPrefix: storageName.folder
      };
    }

    addItemResource(opts).then(results => {
      if (results.success) {
        _updateTemplateResourcePaths(
          data,
          model.itemId,
          EUpdateType.Add,
          opts.params?.resourcesPrefix ? `${opts.params.resourcesPrefix}/${opts.name}` : opts.name,
          ""
        );
      }
      resolve(results);
    }, reject);
  });
}

/**
 * Generates add resource request
 *
 * @param solutionId id for the solution
 * @param model the model for the current solution template
 * @param data the current data object for the solution
 * @param resourceFilePath resource file info
 * @param authentication credentials for the request
 *
 * @returns a promise that will resolve to a response with success true/false
 */
function _remove(
  solutionId: string,
  model: ISolutionModel,
  data: any,
  resourceFilePath: IResourcePath,
  authentication: UserSession
): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    const name: string = resourceFilePath.filename;
    const resources = model.resources.filter(r => r.endsWith(name));
    if (resources.length > 0) {
      const opts: IItemResourceOptions = {
        id: solutionId,
        authentication,
        resource: resources[0]
      };
      removeItemResource(opts).then(results => {
        if (results.success) {
          _updateTemplateResourcePaths(
            data,
            model.itemId,
            EUpdateType.Remove,
            resources[0],
            ""
          );
        }
        resolve(results);
      }, reject);
    } else {
      resolve({ success: false })
    }
  });
}

/**
 * Generates update resource request
 *
 * @param solutionId id for the solution
 * @param model the model for the current solution template
 * @param resourceFilePath resource file info
 * @param authentication credentials for the request
 *
 * @returns a promise that will resolve to a response with success true/false
 */
function _update(
  solutionId: string,
  model: ISolutionModel,
  resourceFilePath: IResourcePath,
  authentication: UserSession
): Promise<any> {
  const sourceFileName: string = resourceFilePath.sourceFileName;

  const opts: IItemResourceOptions = {
    id: solutionId,
    authentication,
    resource: resourceFilePath.blob,
    name: sourceFileName
  };

  const resources = model.resources.filter(r => r.endsWith(sourceFileName));
  if (resources.length === 1) {
    const nameParts = resources[0].split("/");
    if (nameParts.length === 2) {
      opts.prefix = nameParts[0];
    }
  }

  return updateItemResource(opts);
}

/**
 * Update the resources paths for a given template
 *
 * This function will update the provided data argument with any new or removed resource paths
 *
 * @param data the current data object for the solution
 * @param id the id of the current template
 * @param updateType add/update/remove
 * @param path the resource prefix/name
 * @param sourceFileName from the current resourceFilePath
 *
 */
function _updateTemplateResourcePaths(
  data: any,
  id: string,
  updateType: EUpdateType,
  path: string,
  sourceFileName: string
): void {
  data.templates = data.templates.map(t => {
    if (t.itemId === id) {
      switch (updateType) {
        case EUpdateType.Add:
          t.resources.push(path);
          break;
        case EUpdateType.Update:
          t.resources = t.resources.filter(r => r.indexOf(sourceFileName) < 0);
          t.resources.push(path);
          break;
        case EUpdateType.Remove:
          t.resources = t.resources.filter(r => r.indexOf(path) < 0);
          break;
        default:
          break;
      }
    }
    return t;
  })
}