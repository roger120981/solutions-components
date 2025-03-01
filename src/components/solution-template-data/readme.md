# solution-template-data



<!-- Auto Generated Below -->


## Properties

| Property                | Attribute                | Description                                                                                | Type      | Default |
| ----------------------- | ------------------------ | ------------------------------------------------------------------------------------------ | --------- | ------- |
| `instanceid`            | `instanceid`             | This needs to be unique for props vs data of an item                                       | `string`  | `""`    |
| `itemId`                | `item-id`                | A template's itemId. This is used to get the correct model from a store in the json-editor | `string`  | `""`    |
| `organizationVariables` | `organization-variables` |                                                                                            | `string`  | `""`    |
| `solutionVariables`     | `solution-variables`     | Contains the solution based variables                                                      | `string`  | `""`    |
| `varsOpen`              | `vars-open`              | Used to show/hide the variable containers                                                  | `boolean` | `true`  |


## Dependencies

### Used by

 - [solution-item](../solution-item)

### Depends on

- calcite-shell
- calcite-panel
- [json-editor](../json-editor)
- calcite-shell-panel
- calcite-button
- [solution-organization-variables](../solution-organization-variables)
- [solution-variables](../solution-variables)

### Graph
```mermaid
graph TD;
  solution-template-data --> calcite-shell
  solution-template-data --> calcite-panel
  solution-template-data --> json-editor
  solution-template-data --> calcite-shell-panel
  solution-template-data --> calcite-button
  solution-template-data --> solution-organization-variables
  solution-template-data --> solution-variables
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
  json-editor --> calcite-icon
  json-editor --> calcite-button
  calcite-button --> calcite-loader
  calcite-button --> calcite-icon
  solution-organization-variables --> calcite-tree
  solution-organization-variables --> calcite-tree-item
  calcite-tree-item --> calcite-icon
  calcite-tree-item --> calcite-checkbox
  solution-variables --> calcite-tree
  solution-variables --> calcite-tree-item
  solution-variables --> solution-item-icon
  solution-item --> solution-template-data
  style solution-template-data fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
