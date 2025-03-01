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

import { Component, Element, Event, EventEmitter, Host, h, Method, Prop, State, VNode, Watch } from "@stencil/core";
import { EDrawMode, ESelectionType, ISketchGraphicsChange } from "../../utils/interfaces";
import { loadModules } from "../../utils/loadModules";
import state from "../../utils/publicNotificationStore";
import MapDrawTools_T9n from "../../assets/t9n/map-draw-tools/resources.json";
import { getLocaleComponentStrings } from "../../utils/locale";

@Component({
  tag: "map-draw-tools",
  styleUrl: "map-draw-tools.css",
  shadow: false,
})
export class MapDrawTools {
  //--------------------------------------------------------------------------
  //
  //  Host element access
  //
  //--------------------------------------------------------------------------
  @Element() el: HTMLMapDrawToolsElement;

  //--------------------------------------------------------------------------
  //
  //  Properties (public)
  //
  //--------------------------------------------------------------------------

  /**
   * boolean: sketch is used by multiple components...need a way to know who should respond...
   */
  @Prop() active = false;

  /**
   * utils/interfaces: Controls how the draw tools are rendered
   *
   * SKETCH mode supports snapping
   * REFINE mode supports undo/redo
   */
  @Prop() drawMode: EDrawMode = EDrawMode.SKETCH;

  /**
   * boolean: when true you will be able to make additional modifications to the sketched geometry
   */
  @Prop() editGraphicsEnabled = true;

  /**
   * esri/Graphic: https://developers.arcgis.com/javascript/latest/api-reference/esri-Graphic.html
   */
  @Prop({ mutable: true }) graphics: __esri.Graphic[];

  /**
   * esri/views/View: https://developers.arcgis.com/javascript/latest/api-reference/esri-views-MapView.html
   */
  @Prop({ mutable: true }) mapView: __esri.MapView;

  /**
   * esri/symbols/SimpleMarkerSymbol: https://developers.arcgis.com/javascript/latest/api-reference/esri-symbols-SimpleMarkerSymbol.html
   */
  @Prop({ mutable: true }) pointSymbol: __esri.SimpleMarkerSymbol;

  /**
   * esri/symbols/SimpleLineSymbol: https://developers.arcgis.com/javascript/latest/api-reference/esri-symbols-SimpleLineSymbol.html
   */
  @Prop({ mutable: true }) polylineSymbol: __esri.SimpleLineSymbol;

  /**
   * esri/symbols/SimpleFillSymbol: https://developers.arcgis.com/javascript/latest/api-reference/esri-symbols-SimpleFillSymbol.html
   */
  @Prop({ mutable: true }) polygonSymbol: __esri.SimpleFillSymbol;

  /**
   * boolean: when eanbled the user can redo the previous operation
   */
  @Prop() redoEnabled = false;

  /**
   * boolean: when eanbled the user can undo the previous operation
   */
  @Prop() undoEnabled = false;

  //--------------------------------------------------------------------------
  //
  //  State (internal)
  //
  //--------------------------------------------------------------------------

  /**
   * Contains the translations for this component.
   * All UI strings should be defined here.
   */
  @State() _translations: typeof MapDrawTools_T9n;

  /**
   * utils/interfaces/ESelectionType: POINT, LINE, POLY, RECT
   */
  @State() _selectionMode: ESelectionType;

  //--------------------------------------------------------------------------
  //
  //  Properties (protected)
  //
  //--------------------------------------------------------------------------

  /**
   * esri/layers/GraphicsLayer: https://developers.arcgis.com/javascript/latest/api-reference/esri-layers-GraphicsLayer.html?#constructors-summary
   */
  protected GraphicsLayer: typeof import("esri/layers/GraphicsLayer");

  /**
   * esri/widgets/Sketch/SketchViewModel: https://developers.arcgis.com/javascript/latest/api-reference/esri-widgets-Sketch-SketchViewModel.html
   * The sketch view model constructor
   */
  protected SketchViewModel: typeof import("esri/widgets/Sketch/SketchViewModel");

  /**
   * esri/widgets/Sketch: https://developers.arcgis.com/javascript/latest/api-reference/esri-widgets-Sketch.html#constructors-summary
   */
  protected Sketch: typeof import("esri/widgets/Sketch");

  /**
   * esri/layers/GraphicsLayer: https://developers.arcgis.com/javascript/latest/api-reference/esri-layers-GraphicsLayer.html
   * The graphics layer used to show selections.
   */
  protected _sketchGraphicsLayer: __esri.GraphicsLayer;

  /**
   * esri/widgets/Sketch/SketchViewModel: https://developers.arcgis.com/javascript/latest/api-reference/esri-widgets-Sketch-SketchViewModel.html
   */
  protected _sketchViewModel: __esri.SketchViewModel;

  /**
   * esri/widgets/Sketch: https://developers.arcgis.com/javascript/latest/api-reference/esri-widgets-Sketch.html#constructors-summary
   */
  protected _sketchWidget: __esri.Sketch;

  /**
   * The container element for the sketch widget
   */
  protected _sketchElement: HTMLElement;

  //--------------------------------------------------------------------------
  //
  //  Watch handlers
  //
  //--------------------------------------------------------------------------

  /**
   * Called each time the graphics prop is changed.
   */
  @Watch("graphics")
  graphicsWatchHandler(v: any, oldV: any): void {
    if (v && v.length > 0 && JSON.stringify(v) !== JSON.stringify(oldV) && this._sketchGraphicsLayer) {
      this._updateGraphicsSymbols(v);
      this._sketchGraphicsLayer.removeAll();
      this._sketchGraphicsLayer.addMany(v);
    }
  }

  /**
   * Called each time the mapView prop is changed.
   */
  @Watch("mapView")
  mapViewWatchHandler(v: any, oldV: any): void {
    if (v && v !== oldV) {
      this._init();
    }
  }

  //--------------------------------------------------------------------------
  //
  //  Methods (public)
  //
  //--------------------------------------------------------------------------

  /**
   * Clears the user drawn graphics
   *
   * @returns Promise that resolves when the operation is complete
   */
  @Method()
  async clear(): Promise<void> {
    this._clearSketch();
  }

  /**
   * Set the sketch widget to update mode with the current graphic
   *
   * @returns Promise that resolves when the operation is complete
   */
  @Method()
  async updateGraphics(): Promise<void> {
    this._updateGraphics();
  }

  //--------------------------------------------------------------------------
  //
  //  Events (public)
  //
  //--------------------------------------------------------------------------

  /**
   * Emitted on demand when selection starts or ends.
   */
  @Event() selectionLoadingChange: EventEmitter<boolean>;

  /**
   * Emitted on demand when the sketch graphics change.
   */
  @Event() sketchGraphicsChange: EventEmitter<ISketchGraphicsChange>;

  /**
   * Emitted on demand when the undo action is clicked.
   */
  @Event() drawUndo: EventEmitter<void>;

  /**
   * Emitted on demand when the redo action is clicked.
   */
  @Event() drawRedo: EventEmitter<void>;

  //--------------------------------------------------------------------------
  //
  //  Functions (lifecycle)
  //
  //--------------------------------------------------------------------------

  /**
   * StencilJS: Called once just after the component is first connected to the DOM.
   *
   * @returns Promise when complete
   */
  async componentWillLoad(): Promise<void> {
    await this._getTranslations();
    await this._initModules();
  }

  /**
   * StencilJS: Called once just after the component is fully loaded and the first render() occurs.
   *
   * @returns Promise when complete
   */
  componentDidLoad(): void {
    this._init();
  }

  /**
   * StencilJS: Called every time the component is disconnected from the DOM
   */
  disconnectedCallback(): void {
    // cancel any existing create operations
    this._sketchWidget.cancel();
    // clear any current temp sketch
    this._clearSketch();
  }

  /**
   * Renders the component.
   */
  render(): VNode {
    const containerClass = this.drawMode === EDrawMode.SKETCH ?
      "border" : "border esri-widget esri-sketch__panel";

    const undoRedoClass = this.drawMode === EDrawMode.SKETCH ?
      "display-none" : "esri-widget esri-sketch__panel border-left esri-sketch__section";

    return (
      <Host>
        <div class={containerClass}>
          <div ref={(el) => { this._sketchElement = el }} />
          <div class={undoRedoClass}>
            <calcite-action
              disabled={!this.undoEnabled}
              icon="undo"
              onClick={() => this._undo()}
              scale="s"
              text={this._translations.undo}
            />
            <calcite-action
              disabled={!this.redoEnabled}
              icon="redo"
              onClick={() => this._redo()}
              scale="s"
              text={this._translations.redo}
            />
          </div>
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
    const [GraphicsLayer, Sketch, SketchViewModel] = await loadModules([
      "esri/layers/GraphicsLayer",
      "esri/widgets/Sketch",
      "esri/widgets/Sketch/SketchViewModel"
    ]);
    this.GraphicsLayer = GraphicsLayer;
    this.Sketch = Sketch;
    this.SketchViewModel = SketchViewModel;
  }

  /**
   * Initialize the graphics layer and the tools that support creating new graphics
   *
   * @protected
   */
  protected _init(): void {
    if (this.mapView && this._sketchElement) {
      this._initGraphicsLayer();
      this._initSketch();
    }
  }

  /**
   * Initialize the graphics layer
   *
   * @returns Promise when the operation has completed
   * @protected
   */
  protected _initGraphicsLayer(): void {
    const title = this._translations.sketchLayer;
    const sketchIndex = this.mapView.map.layers.findIndex((l) => l.title === title);
    if (sketchIndex > -1) {
      this._sketchGraphicsLayer = this.mapView.map.layers.getItemAt(sketchIndex) as __esri.GraphicsLayer;
    } else {
      this._sketchGraphicsLayer = new this.GraphicsLayer({ title, listMode: "hide" });
      state.managedLayers.push(title);
      this.mapView.map.layers.add(this._sketchGraphicsLayer);
    }

    if (this.graphics && this.graphics.length > 0) {
      this._sketchGraphicsLayer.addMany(this.graphics);
    }
  }

  /**
   * Initialize the skecth widget
   *
   * @protected
   */
  protected _initSketch(): void {
    const sketchOptions: __esri.SketchViewModelProperties | __esri.SketchProperties = {
      layer: this._sketchGraphicsLayer,
      view: this.mapView,
      defaultCreateOptions: {
        mode: "hybrid"
      },
      defaultUpdateOptions: {
        preserveAspectRatio: false,
        enableScaling: false,
        enableRotation: false,
        tool: "reshape",
        toggleToolOnClick: false
      }
    };
    this._sketchWidget = new this.Sketch({
      ...sketchOptions,
      container: this._sketchElement,
      creationMode: "single",
      visibleElements: {
        duplicateButton: false,
        selectionTools: {
          "lasso-selection": false,
          "rectangle-selection": false
        }, createTools: {
          circle: false
        },
        undoRedoMenu: false,
        settingsMenu: this.drawMode === EDrawMode.SKETCH
      }
    });

    this._sketchViewModel = new this.SketchViewModel({
      ...sketchOptions
    });

    this._sketchWidget.viewModel.polylineSymbol = this.polylineSymbol;
    this._sketchWidget.viewModel.pointSymbol = this.pointSymbol;
    this._sketchWidget.viewModel.polygonSymbol = this.polygonSymbol;

    let forceCreate = false;
    this._sketchWidget.on("create", (evt) => {
      if (evt.state === "complete") {
        this.graphics = [evt.graphic];
        this.sketchGraphicsChange.emit({
          graphics: this.graphics,
          useOIDs: false
        });

        if (this.drawMode === EDrawMode.REFINE) {
          // calling create during complete will force the cancel event
          // https://developers.arcgis.com/javascript/latest/api-reference/esri-widgets-Sketch.html#event-create
          forceCreate = true;
          this._sketchWidget.viewModel.create(evt.tool);
        }
      }

      if (evt.state === "cancel" && this.drawMode === EDrawMode.REFINE && forceCreate) {
        forceCreate = !forceCreate;
        this._sketchWidget.viewModel.create(evt.tool);
      }
    });

    this._sketchWidget.on("update", (evt) => {
      if (!this.editGraphicsEnabled) {
        this._sketchWidget.viewModel.cancel();
        this._sketchViewModel.cancel();
      } else {
        const eventType = evt?.toolEventInfo?.type;
        if (eventType === "reshape-stop" || eventType === "move-stop") {
          this.graphics = evt.graphics;
          this.sketchGraphicsChange.emit({
            graphics: this.graphics,
            useOIDs: false
          });
        }
      }
    });

    this._sketchWidget.on("delete", () => {
      this.graphics = [];
      this.sketchGraphicsChange.emit({
        graphics: this.graphics,
        useOIDs: false
      });
    });

    this._sketchWidget.on("undo", (evt) => {
      this.graphics = evt.graphics;
      this.sketchGraphicsChange.emit({
        graphics: this.graphics,
        useOIDs: false
      });
    });

    this._sketchWidget.on("redo", (evt) => {
      this.graphics = evt.graphics;
      this.sketchGraphicsChange.emit({
        graphics: this.graphics,
        useOIDs: false
      });
    });
  }

  /**
   * Clear any stored graphics and remove all graphics from the graphics layer
   *
   * @protected
   */
  protected _clearSketch(): void {
    this._sketchWidget.viewModel.cancel();
    this.graphics = [];
    this._sketchGraphicsLayer?.removeAll();
  }

  /**
   * Emit the undo event
   *
   * @protected
   */
  protected _undo(): void {
    this.drawUndo.emit();
  }

  /**
   * Emit the undo event
   *
   * @protected
   */
  protected _redo(): void {
    this.drawRedo.emit();
  }

  /**
   * Set the sketch widget to update mode with the current graphic
   *
   * reshape tool only supports a single graphic
   *
   * @protected
   */
  protected _updateGraphics(): void {
    setTimeout(() => {
      if (this.graphics.length === 1) {
        void this._sketchWidget.update(this.graphics, {
          tool: "reshape",
          enableRotation: false,
          enableScaling: false,
          preserveAspectRatio: false,
          toggleToolOnClick: false
        });
      }
    }, 100);
  }

  /**
   * Any time graphics are added update the symbology so they will always be consistent
   * regardless of where they are from.
   * https://github.com/Esri/solutions-components/issues/246
   *
   * reshape tool only supports a single graphic
   *
   * @protected
   */
  protected _updateGraphicsSymbols(
    graphics: __esri.Graphic[]
  ): void {
    // graphics will only be of one gemetry type
    const graphic = graphics[0];
    const type = graphic.geometry.type;
    const symbol = type === "point" ? this.pointSymbol :
      type === "polyline" ? this.polylineSymbol :
      type === "polygon" ? this.polygonSymbol : undefined;
    if (symbol) {
      graphics.forEach(g => g.symbol = symbol);
    }
  }

  /**
   * Fetches the component's translations
   *
   * @protected
   */
  protected async _getTranslations(): Promise<void> {
    const translations = await getLocaleComponentStrings(this.el);
    this._translations = translations[0] as typeof MapDrawTools_T9n;
  }
}
