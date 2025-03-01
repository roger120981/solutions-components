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

import "@esri/calcite-components";
import * as pdfLabelFormats from "../../assets/data/labelFormats.json";
import * as downloadUtils from "../../utils/downloadUtils";
import PdfDownload_T9n from "../../assets/t9n/pdf-download/resources.json";
import { loadModules } from "../../utils/loadModules";
import { Component, Element, Host, h, Method, Prop, State, VNode } from "@stencil/core";
import { getLocaleComponentStrings } from "../../utils/locale";
import { IExportInfos } from "../../utils/interfaces";

@Component({
  tag: "pdf-download",
  styleUrl: "pdf-download.css",
  shadow: true,
})
export class PdfDownload {
  //--------------------------------------------------------------------------
  //
  //  Host element access
  //
  //--------------------------------------------------------------------------
  @Element() el: HTMLPdfDownloadElement;

  //--------------------------------------------------------------------------
  //
  //  Properties (public)
  //
  //--------------------------------------------------------------------------

  /**
   * number: The default number of labels per page to export
   */
  @Prop() defaultNumLabelsPerPage: number;

  /**
   * boolean: Controls the enabled/disabled state of download
   */
  @Prop() disabled = false;

  //--------------------------------------------------------------------------
  //
  //  State (internal)
  //
  //--------------------------------------------------------------------------

  /**
   * Contains the translations for this component.
   * All UI strings should be defined here.
   */
  @State() protected _translations: typeof PdfDownload_T9n;

  //--------------------------------------------------------------------------
  //
  //  Properties (protected)
  //
  //--------------------------------------------------------------------------

  /**
   * HTMLCalciteSelectElement: The html element for selecting buffer unit
   */
  protected _labelInfoElement: HTMLCalciteSelectElement;

  /**
   * intl: https://developers.arcgis.com/javascript/latest/api-reference/esri-intl.html
   */
  protected _intl: __esri.intl;

  //--------------------------------------------------------------------------
  //
  //  Watch handlers
  //
  //--------------------------------------------------------------------------

  //--------------------------------------------------------------------------
  //
  //  Methods (public)
  //
  //--------------------------------------------------------------------------

  /**
   * Downloads csv of mailing labels for the provided list of ids
   *
   * @param webmap Webmap containing layer
   * @param exportInfos Information about items to be exported
   * @param removeDuplicates When true a single label is generated when multiple featues have a shared address value
   * @param addColumnTitle Indicates if column headings should be included in output
   * @returns Promise resolving when function is done
   */
  @Method()
  async downloadCSV(
    webmap: __esri.Map,
    exportInfos: IExportInfos,
    removeDuplicates: boolean,
    addColumnTitle = true
  ): Promise<void> {
    return downloadUtils.downloadCSV(
      webmap,
      exportInfos,
      true, // formatUsingLayerPopup
      removeDuplicates,
      addColumnTitle
    );
  }

  /**
   * Downloads pdf of mailing labels for the provided list of ids
   *
   * @param webmap Webmap containing layer
   * @param exportInfos Information about items to be exported
   * @param removeDuplicates When true a single label is generated when multiple featues have a shared address value
   * @param title Title for each page
   * @param initialImageDataUrl Data URL of image for first page
   * @returns Promise resolving when function is done
   */
  @Method()
  async downloadPDF(
    webmap: __esri.Map,
    exportInfos: IExportInfos,
    removeDuplicates = false,
    title = "",
    initialImageDataUrl = ""
  ): Promise<void> {
    return downloadUtils.downloadPDF(
      webmap,
      exportInfos,
      this._labelInfoElement.selectedOption?.value as downloadUtils.ILabel,
      removeDuplicates,
      title,
      initialImageDataUrl
    );
  }

  //--------------------------------------------------------------------------
  //
  //  Events (public)
  //
  //--------------------------------------------------------------------------

  //--------------------------------------------------------------------------
  //
  //  Functions (lifecycle)
  //
  //--------------------------------------------------------------------------

  /**
   * StencilJS: Called once just after the component is first connected to the DOM.
   */
  async componentWillLoad(): Promise<void> {
    await this._getTranslations();
    await this._initModules();
  }

  /**
   * Renders the component.
   */
  render(): VNode {
    return (
      <Host>
        <calcite-select
          disabled={this.disabled}
          label=""
          ref={(el) => { this._labelInfoElement = el }}
        />
      </Host>
    );
  }

  componentDidLoad(): void {
    // Render the options outside of Stencil's rendering so that it doesn't mangle RTL text with embedded LTR
    this._renderOptions();
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
    const [intl] = await loadModules([
      "esri/intl"
    ]);
    this._intl = intl;
  }

  /**
   * Gets the formatted pdf export size text
   *
   * @param labelInfo current user selected label info
   *
   * @returns the pdf label as a string
   * @protected
   */
  protected _getLabelSizeText(
    labelInfo: any
  ): string {
    const lNum = labelInfo.descriptionPDF.labelsPerPageDisplay;
    const lSize =
      "&lrm;" + (labelInfo.descriptionPDF.labelWidthDisplay as string) + " x " +
      (labelInfo.descriptionPDF.labelHeightDisplay as string) + "&rlm;";
    return this._translations.pdfLabel.replace("{{n}}", lNum).replace("{{labelSize}}", lSize);
  }

  /**
   * Fetches the component's translations
   *
   * @protected
   */
  protected async _getTranslations(): Promise<void> {
    const translations = await getLocaleComponentStrings(this.el);
    this._translations = translations[0] as typeof PdfDownload_T9n;
  }

  /**
   * Renders the pdf export size options and adds them to the `select` component
   *
   * @protected
   */
  protected _renderOptions(): void {
    const s: any = pdfLabelFormats;
    const sortedPdfIndo = (s.default || s).sort((a, b) => {
      const _a = parseInt(a.descriptionPDF.labelsPerPageDisplay, 10);
      const _b = parseInt(b.descriptionPDF.labelsPerPageDisplay, 10);
      return _a < _b ? -1 : _a > _b ? 1 : 0
    });
    sortedPdfIndo.forEach((l, i) => {
      const option = document.createElement("calcite-option");
      option.value = l;
      option.innerHTML = this._getLabelSizeText(l);
      this._labelInfoElement.appendChild(option);
      if (this.defaultNumLabelsPerPage ? parseInt(l.descriptionPDF.labelsPerPageDisplay, 10) === this.defaultNumLabelsPerPage : i === 0) {
        // Setting selected wasn't enough to trigger it being the 'selectedOption'
        option.selected = true;
        this._labelInfoElement.selectedOption = option;
      }
    });
  }

}
