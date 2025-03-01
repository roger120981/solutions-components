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

import { Component, Element, Host, h, Prop, VNode, State, Watch, Event, EventEmitter } from "@stencil/core";
import { IMapChange, IMapInfo, ISearchConfiguration, theme } from "../../utils/interfaces";
import { getLocaleComponentStrings } from "../../utils/locale";
import { loadModules } from "../../utils/loadModules";
import CrowdsourceReporter_T9n from "../../assets/t9n/crowdsource-reporter/resources.json";
import { getAllLayers } from "../../utils/mapViewUtils";

@Component({
  tag: "crowdsource-reporter",
  styleUrl: "crowdsource-reporter.css",
  shadow: false,
})
export class CrowdsourceReporter {
  //--------------------------------------------------------------------------
  //
  //  Host element access
  //
  //--------------------------------------------------------------------------

  @Element() el: HTMLCrowdsourceReporterElement;

  //--------------------------------------------------------------------------
  //
  //  Properties (public)
  //
  //--------------------------------------------------------------------------

  /**
   * string: The text that will display under the title on the landing page
   */
  @Prop() description: string;

  /**
   * boolean: When true the application will be in mobile mode, controls the mobile or desktop view
   */
  @Prop() isMobile: boolean;

  /**
   * boolean: When true the anonymous users will be allowed to submit reports and comments
   */
  @Prop() enableAnonymousAccess: boolean;

  /**
   * boolean: When true the anonymous users will be allowed to submit comments
   */
  @Prop() enableAnonymousComments: boolean;

  /**
   * boolean: When true the user will be allowed to submit comments
   */
  @Prop() enableComments: boolean;

  /**
   * boolean: When true the user will be provided a login page
   */
  @Prop() enableLogin: boolean;

  /**
   * boolean: When true the user will be allowed to submit new reports
   */
  @Prop() enableNewReports: boolean;

  /**
   * string[]: list of layer ids
   */
  @Prop() layers: string[];

  /**
   * string: The text that will display at the top of the landing page
   */
  @Prop() loginTitle: string;

  /**
   * esri/views/MapView: https://developers.arcgis.com/javascript/latest/api-reference/esri-views-MapView.html
   */
  @Prop() mapView: __esri.MapView;

  /**
   * string: The word(s) to display in the reports submit button
   */
  @Prop() reportButtonText: string;

  /**
   * string: The word(s) to display in the reports header
   */
  @Prop() reportsHeader: string;

  /**
   * string: The message to display when the report has been submitted
   */
  @Prop() reportSubmittedMessage: string;

  /**
   * ISearchConfiguration: Configuration details for the Search widget
   */
  @Prop() searchConfiguration: ISearchConfiguration;

  /**
   * boolean: When true the comments from all users will be visible
   */
  @Prop() showComments: boolean;

  /**
   * string: Item ID of the web map that should be selected by default
   */
  @Prop() defaultWebmap = "";

  /**
   * boolean: when true the search widget will be available
   */
  @Prop() enableSearch = true;

  /**
   * boolean: when true the home widget will be available
   */
  @Prop() enableHome = true;

  /**
   * IMapInfo[]: array of map infos (name and id)
   */
  @Prop() mapInfos: IMapInfo[] = [];

  /**
   * theme: "light" | "dark" theme to be used
   */
  @Prop() theme: theme = "light";

  /**
   * boolean: when true the zoom widget will be available
   */
  @Prop() enableZoom = true;

  //--------------------------------------------------------------------------
  //
  //  State (internal)
  //
  //--------------------------------------------------------------------------

  /**
   * IMapInfo: The current map info stores configuration details
   */
  @State() _mapInfo: IMapInfo;

  /**
   * string[]: Reporter flow items list
   */
  @State() _flowItems: string[] = ["layer-list"];

  /**
   * boolean: Controls the state for panel in mobile view
   */
  @State() _sidePanelCollapsed = false;

  /**
   * Contains the translations for this component.
   * All UI strings should be defined here.
   */
  @State() _translations: typeof CrowdsourceReporter_T9n;

  /**
   * boolean: When true show the sort and filter icon
   */
  @State() _hasValidLayers = false;

  /**
   * string: The selected feature layer's name from the layer's list
   */
  @State() _selectedLayerName: string;

  //--------------------------------------------------------------------------
  //
  //  Properties (protected)
  //
  //--------------------------------------------------------------------------

  /**
   * IMapChange: The current map change details
   */
  protected _mapChange: IMapChange;

  /**
   * number[]: X,Y pair used to center the map
   */
  protected _defaultCenter: number[];

  /**
   * number: zoom level the map should go to
   */
  protected _defaultLevel: number;

  /**
   * string: The selected feature layer's id from the layer's list
   */
  protected _selectedLayerId: string;

  /**
   * __esri.Graphic: The selected feature
   */
  protected _selectedFeature: __esri.Graphic[];

  /**
   * esri/core/reactiveUtils: https://developers.arcgis.com/javascript/latest/api-reference/esri-core-reactiveUtils.html
   */
  protected reactiveUtils: typeof import("esri/core/reactiveUtils");

  /**
   * IHandle: The map click handle
   */
  protected _mapClickHandle: IHandle;

  //--------------------------------------------------------------------------
  //
  //  Watch handlers
  //
  //--------------------------------------------------------------------------

  /**
   * Called each time the mapView prop is changed.
   */
  @Watch("isMobile")
  async isMobileWatchHandler(): Promise<void> {
      this._sidePanelCollapsed = false;
  }

  /**
   * Called each time the mapView prop is changed.
   */
  @Watch("mapView")
  async mapViewWatchHandler(): Promise<void> {
    await this.mapView.when(async () => {
      await this.setMapView();
    });
  }

  //--------------------------------------------------------------------------
  //
  //  Methods (public)
  //
  //--------------------------------------------------------------------------

  //--------------------------------------------------------------------------
  //
  //  Events (public)
  //
  //--------------------------------------------------------------------------

   /**
   * Emitted when toggle panel button is clicked in reporter
   */
   @Event() togglePanel: EventEmitter<boolean>;

  //--------------------------------------------------------------------------
  //
  //  Functions (lifecycle)
  //
  //--------------------------------------------------------------------------

  /**
   * StencilJS: Called once just after the component is first connected to the DOM.
   * Create component translations and monitor the mediaQuery change to detect mobile/desktop mode
   * @returns Promise when complete
   */
  async componentWillLoad(): Promise<void> {
    await this._initModules();
    await this._getTranslations();
  }

  /**
   * Renders the component.
   */
  render() {
    return (
      <Host>
        <div>
          <calcite-shell content-behind >
            {this._getReporter()}
          </calcite-shell>
        </div>
      </Host>
    );
  }

  //--------------------------------------------------------------------------
  //
  //  Functions (protected)
  //
  //--------------------------------------------------------------------------

  /**
   * Load esri javascript api modules
   *
   * @returns Promise resolving when function is done
   *
   * @protected
   */
  protected async _initModules(): Promise<void> {
    const [reactiveUtils] = await loadModules([
      "esri/core/reactiveUtils"
    ]);
    this.reactiveUtils = reactiveUtils;
  }

  /**
   * Get the reporter app functionality
   * @protected
   */
  protected _getReporter(): VNode {
    const renderLists = []
    this._flowItems.forEach((item) => {
      switch (item) {
        case "layer-list":
          renderLists.push(this.getLayerListFlowItem());
          break;
        case "feature-list":
          renderLists.push(this.getFeatureListFlowItem(this._selectedLayerId, this._selectedLayerName));
          break;
        case "feature-details":
          renderLists.push(this.getFeatureDetailsFlowItem());
          break;

      }
    });
    const themeClass = this.theme === "dark" ? "calcite-mode-dark" : "calcite-mode-light";
    return (
      <calcite-panel class={"width-full " + themeClass}>
        {this.mapView
          ? <calcite-flow>
            {renderLists?.length > 0 && renderLists}
          </calcite-flow>
          : <calcite-loader scale="m" />}
      </calcite-panel>
    );
  }

  /**
   * Get the feature layer list
   * @returns the layer list items
   * @protected
   */
  protected getLayerListFlowItem(): Node {
    return (
      <calcite-flow-item
        collapsed={this.isMobile && this._sidePanelCollapsed}
        heading={this.reportsHeader}>
        {this._hasValidLayers &&
          <calcite-action
            icon="sort-ascending-arrow"
            slot={this.isMobile ? "header-menu-actions" : "header-actions-end"}
            text={this._translations.sort}
            text-enabled={this.isMobile} />}
        {this._hasValidLayers &&
          <calcite-action
            icon="filter"
            slot={this.isMobile ? "header-menu-actions" : "header-actions-end"}
            text={this._translations.filter}
            text-enabled={this.isMobile} />}
        {this.isMobile && this.getActionToExpandCollapsePanel()}
        {this._hasValidLayers && this.enableNewReports &&
          <calcite-button
            appearance="secondary"
            slot="footer"
            width="full">
            {this.reportButtonText}
          </calcite-button>}
        <calcite-panel
          full-height
          full-width>
          <layer-list
            class="height-full"
            layers={this.layers}
            mapView={this.mapView}
            noLayerErrorMsg={this._translations.noLayerToDisplayErrorMsg}
            onLayerSelect={this.displayFeaturesList.bind(this)}
            onLayersListLoaded={this.layerListLoaded.bind(this)} 
            showFeatureCount
            showNextIcon/>
        </calcite-panel>
      </calcite-flow-item>);
  }

  /**
   * When layer list is loaded, we will receive the list of layers, if its  means we don't have any valid layer to be listed
   * @param evt Event which has list of layers
   * @protected
   */
  protected layerListLoaded(evt: CustomEvent): void {
    const layersListed = evt.detail;
    this.handleMapClick(layersListed);
    this._hasValidLayers = layersListed.length > 0;
  }

  /**On click of layer list item show feature list
   * @param evt Event which has details of selected layerId and layerName
   * @protected
   */
  protected displayFeaturesList(evt: CustomEvent): void {
    this._selectedLayerId = evt.detail.layerId;
    this._selectedLayerName = evt.detail.layerName;
    this._flowItems = [...this._flowItems, "feature-list"];
  }

  /**
   * On back from feature list navigate to the Layer list panel
   * @protected
   */
  protected backFromFeatureList(): void {
    const updatedFlowItems = [...this._flowItems];
    updatedFlowItems.pop();
    this._flowItems = [...updatedFlowItems];
  }

  /**
   * Toggle side panel in case of mobile mode
   * @protected
   */
  protected toggleSidePanel(): void {
    this._sidePanelCollapsed = !this._sidePanelCollapsed;
    this.togglePanel.emit(this._sidePanelCollapsed);
  }

  /**
   * When feature is selected from list store that and show feature details
   * @param evt Event which has details of selected feature
   */
  protected async onFeatureSelectFromList(evt: CustomEvent): Promise<void> {
    this._selectedFeature = [evt.detail];
    this._flowItems = [...this._flowItems, "feature-details"];
  }

  /**
   * Get feature list of the selected feature layer
   * @param layerId Layer id
   * @param layerName Layer name
   * @returns feature list node
   * @protected
   */
  protected getFeatureListFlowItem(layerId: string, layerName: string): Node {
    return (
      <calcite-flow-item
        collapsed={this.isMobile && this._sidePanelCollapsed}
        heading={layerName}
        onCalciteFlowItemBack={this.backFromFeatureList.bind(this)}>
        <calcite-action
          icon="sort-ascending-arrow"
          slot={this.isMobile ? "header-menu-actions" : "header-actions-end"}
          text={this._translations.sort}
          text-enabled={this.isMobile} />
        <calcite-action
          icon="filter"
          slot={this.isMobile ? "header-menu-actions" : "header-actions-end"}
          text={this._translations.filter}
          text-enabled={this.isMobile} />
        {this.isMobile && this.getActionToExpandCollapsePanel()}
        {this.enableNewReports &&
          <calcite-button
            appearance="secondary"
            slot="footer"
            width="full">
            {this.reportButtonText}
          </calcite-button>}
        <calcite-panel full-height>
          {<feature-list
            class="height-full"
            highlightOnMap
            mapView={this.mapView}
            noFeaturesFoundMsg={this._translations.featureErrorMsg}
            onFeatureSelect={this.onFeatureSelectFromList.bind(this)}
            pageSize={30}
            selectedLayerId={layerId}
          />}
        </calcite-panel>
      </calcite-flow-item>);
  }

  /**
   * Returns the calcite-flow item for feature details
   * @returns Node
   */
  protected getFeatureDetailsFlowItem(): Node {
    return (
      <calcite-flow-item
        collapsed={this.isMobile && this._sidePanelCollapsed}
        heading={this._selectedLayerName}
        onCalciteFlowItemBack={this.backFromFeatureList.bind(this)}>
        {this.isMobile && this.getActionToExpandCollapsePanel()}
        <calcite-action
          icon="share"
          slot={"header-actions-end"}
          text={this._translations.share} />
        <calcite-panel full-height>
          <info-card
            allowEditing={false}
            graphics={this._selectedFeature}
            isLoading={false}
            isMobile={false}
            mapView={this.mapView}
            onSelectionChanged={this.featureDetailsChanged.bind(this)}
            zoomAndScrollToSelected={true}
          />
        </calcite-panel>
      </calcite-flow-item>
    );
  }

  /**
   * On Feature details change update the Layer title and the current selected layer id
   * @param evt Event hold the details of current feature graphic in the info-card
   */
  protected featureDetailsChanged(evt: any): void {
    this._selectedLayerId = evt.detail[0].layer.id;
    this._selectedLayerName = evt.detail[0].layer.title;
  }

  /**
   * Returns the action button to Expand/Collapse side panel in mobile mode
   */
  protected getActionToExpandCollapsePanel(): Node {
    return (
      <calcite-action
        icon={this._sidePanelCollapsed ? "chevrons-up" : "chevrons-down"}
        onClick={this.toggleSidePanel.bind(this)}
        slot="header-actions-end"
        text={this._sidePanelCollapsed ? this._translations.expand : this._translations.collapse} />
    );
  }

  /**
   * Set the current map info when maps change
   * @protected
   */
  protected async setMapView(): Promise<void> {
    this.mapView.popupEnabled = false;
    if (this._defaultCenter && this._defaultLevel) {
      await this.mapView.goTo({
        center: this._defaultCenter,
        zoom: this._defaultLevel
      });
      this._defaultCenter = undefined;
      this._defaultLevel = undefined;
    }
  }

  /**
   * Handle map click event 
   * @param layers Array of layerIds
   * 
   *  @protected
   */
  protected handleMapClick(layers: string[]): void {
    if (this._mapClickHandle) {
      this._mapClickHandle.remove();
    }
    this._mapClickHandle = this.reactiveUtils.on(
      () => this.mapView,
      "click",
      (event) => {
        void this.onMapClick(event, layers)
      }
    );
  }

  /**
   * On map click do hitTest and get the clicked graphics of valid layers and show feature details
   * @param event 
   * @param layers 
   * 
   * @protected
   */
  protected async onMapClick(event:any, layers:string[]): Promise<void> {
    //disable map popup
    this.mapView.popupEnabled = false;
    // only include graphics from valid layers listed in the layer list widget
    const allMapLayers = await getAllLayers(this.mapView);
    const validLayers = []
    allMapLayers.forEach((eachLayer: __esri.FeatureLayer) => {
      if (layers.includes(eachLayer.id)) {
        validLayers.push(eachLayer)
      }
    })
    const opts = {
      include: validLayers
    };
    // Perform a hitTest on the View
    const hitTest = await this.mapView.hitTest(event, opts);
    if (hitTest.results.length > 0) {
      const clickedGraphics = []
      hitTest.results.forEach(function (result) {
        // check if the result type is graphic
        if (result.type === 'graphic') {
          clickedGraphics.push(result.graphic)
        }
      });
      //update the selectedFeature
      this._selectedFeature = clickedGraphics;
      //if featureDetails not open then add it to the list else just reInit flowItems which will update details with newly selected features
      // eslint-disable-next-line unicorn/prefer-ternary
      if (this._flowItems.length && this._flowItems[this._flowItems.length - 1] !== "feature-details") {
        this._flowItems = [...this._flowItems, "feature-details"];
      } else {
        this._flowItems = [...this._flowItems];
      }
    }
  }

  /**
   * Fetches the component's translations
   * @returns Promise when complete
   * @protected
   */
  protected async _getTranslations(): Promise<void> {
    const messages = await getLocaleComponentStrings(this.el);
    this._translations = messages[0] as typeof CrowdsourceReporter_T9n;
  }
}
