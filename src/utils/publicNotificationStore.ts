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

import { createStore } from "@stencil/store";

const { state, onChange } = createStore({
	// List of layers added and managed by the component
	managedLayers: [],
	// List of tables added and managed by the component
	managedTables: [],
	// Handle[]: https://developers.arcgis.com/javascript/latest/api-reference/esri-core-Handles.html#Handle
	highlightHandles: [],
	// remove all handles
	removeHandles: () => {
		state.highlightHandles.forEach(h => h?.remove());
		state.highlightHandles = [];
	}
});

const managedLayersChangedEvent = new CustomEvent("managedLayersChanged", {
	bubbles: true,
	cancelable: false,
	composed: true
});

onChange("managedLayers", () => {
	dispatchEvent(managedLayersChangedEvent);
});

export default state;
