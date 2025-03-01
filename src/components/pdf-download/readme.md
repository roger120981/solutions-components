# pdf-download



<!-- Auto Generated Below -->


## Properties

| Property                  | Attribute                     | Description                                              | Type      | Default     |
| ------------------------- | ----------------------------- | -------------------------------------------------------- | --------- | ----------- |
| `defaultNumLabelsPerPage` | `default-num-labels-per-page` | number: The default number of labels per page to export  | `number`  | `undefined` |
| `disabled`                | `disabled`                    | boolean: Controls the enabled/disabled state of download | `boolean` | `false`     |


## Methods

### `downloadCSV(webmap: __esri.Map, exportInfos: IExportInfos, removeDuplicates: boolean, addColumnTitle?: boolean) => Promise<void>`

Downloads csv of mailing labels for the provided list of ids

#### Returns

Type: `Promise<void>`

Promise resolving when function is done

### `downloadPDF(webmap: __esri.Map, exportInfos: IExportInfos, removeDuplicates?: boolean, title?: string, initialImageDataUrl?: string) => Promise<void>`

Downloads pdf of mailing labels for the provided list of ids

#### Returns

Type: `Promise<void>`

Promise resolving when function is done


## Dependencies

### Used by

 - [public-notification](../public-notification)

### Depends on

- calcite-select
- calcite-option

### Graph
```mermaid
graph TD;
  pdf-download --> calcite-select
  pdf-download --> calcite-option
  calcite-select --> calcite-icon
  public-notification --> pdf-download
  style pdf-download fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
