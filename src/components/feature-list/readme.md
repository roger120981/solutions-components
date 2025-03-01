# feature-list



<!-- Auto Generated Below -->


## Properties

| Property             | Attribute               | Description                                                                                                                                          | Type      | Default     |
| -------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------- |
| `highlightOnMap`     | `highlight-on-map`      | boolean: Highlight feature on map optional (default false) boolean to indicate if we should highlight and zoom to the extent of the feature geometry | `boolean` | `false`     |
| `mapView`            | --                      | esri/views/View: https://developers.arcgis.com/javascript/latest/api-reference/esri-views-MapView.html                                               | `MapView` | `undefined` |
| `noFeaturesFoundMsg` | `no-features-found-msg` | string: Message to be displayed when features are not found                                                                                          | `string`  | `undefined` |
| `pageSize`           | `page-size`             | number: Number features to be fetched per page, by default 100 features will be fetched                                                              | `number`  | `100`       |
| `selectedLayerId`    | `selected-layer-id`     | string: Layer id of the feature layer to show the list                                                                                               | `string`  | `undefined` |


## Events

| Event           | Description                                               | Type                   |
| --------------- | --------------------------------------------------------- | ---------------------- |
| `featureSelect` | Emitted on demand when feature is selected using the list | `CustomEvent<Graphic>` |


## Dependencies

### Used by

 - [crowdsource-reporter](../crowdsource-reporter)

### Depends on

- calcite-panel
- calcite-loader
- calcite-notice
- calcite-list
- calcite-pagination
- calcite-list-item
- calcite-icon

### Graph
```mermaid
graph TD;
  feature-list --> calcite-panel
  feature-list --> calcite-loader
  feature-list --> calcite-notice
  feature-list --> calcite-list
  feature-list --> calcite-pagination
  feature-list --> calcite-list-item
  feature-list --> calcite-icon
  calcite-panel --> calcite-action
  calcite-panel --> calcite-action-menu
  calcite-panel --> calcite-scrim
  calcite-action --> calcite-loader
  calcite-action --> calcite-icon
  calcite-action-menu --> calcite-action
  calcite-action-menu --> calcite-popover
  calcite-popover --> calcite-action
  calcite-popover --> calcite-icon
  calcite-scrim --> calcite-loader
  calcite-notice --> calcite-icon
  calcite-list --> calcite-scrim
  calcite-list --> calcite-stack
  calcite-list --> calcite-filter
  calcite-filter --> calcite-input
  calcite-input --> calcite-progress
  calcite-input --> calcite-icon
  calcite-pagination --> calcite-icon
  calcite-list-item --> calcite-icon
  calcite-list-item --> calcite-handle
  calcite-list-item --> calcite-action
  calcite-handle --> calcite-icon
  crowdsource-reporter --> feature-list
  style feature-list fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
