/**
 * @module commutable
 */
/**
 *
 * This is the top level data structure for in memory data structures,
 * and allows converting from on-disk v4 and v3 Jupyter Notebooks
 *
 */
import * as v4 from "./v4";
import * as v3 from "./v3";

import { Map as ImmutableMap, List as ImmutableList, Record } from "immutable";

import { ImmutableCell } from "./cells";
import { JSONType, CellId } from "./primitives";

export type NotebookRecordParams = {
  cellOrder: ImmutableList<CellId>;
  cellMap: ImmutableMap<CellId, ImmutableCell>;
  nbformatMinor: number;
  nbformat: number;
  metadata: ImmutableMap<string, any>;
};

export const makeNotebookRecord = Record<NotebookRecordParams>({
  cellOrder: ImmutableList(),
  cellMap: ImmutableMap(),
  nbformatMinor: 0,
  nbformat: 4,
  metadata: ImmutableMap()
});

export type ImmutableNotebook = Record<NotebookRecordParams> &
  Readonly<NotebookRecordParams>;

const freezeReviver = <T extends JSONType>(_k: string, v: T) =>
  Object.freeze(v) as T;

export type Notebook = v4.Notebook | v3.Notebook;

/**
 * Converts a string representation of a notebook into a JSON representation.
 *
 * @param notebookString A string representation of a notebook.
 *
 * @returns A JSON representation of the same notebook.
 */
export const parseNotebook = (notebookString: string): Notebook =>
  JSON.parse(notebookString, freezeReviver);

export const fromJS = (
  notebook: v4.Notebook | v3.Notebook | ImmutableNotebook
) => {
  if (Record.isRecord(notebook)) {
    if (notebook.has("cellOrder") && notebook.has("cellMap")) {
      return notebook;
    }
    throw new TypeError(
      `commutable was passed an Immutable.Record structure that is not a notebook`
    );
  }

  if (notebook.nbformat === 4 && notebook.nbformat_minor >= 0) {
    var v4Notebook = notebook as v4.Notebook;

    if (
      Array.isArray(v4Notebook.cells) &&
      typeof notebook.metadata === "object"
    ) {
      return v4.fromJS(v4Notebook);
    }
  } else if (notebook.nbformat === 3 && notebook.nbformat_minor >= 0) {
    return v3.fromJS(notebook as v3.Notebook);
  }

  if (notebook.nbformat) {
    throw new TypeError(
      `nbformat v${notebook.nbformat}.${notebook.nbformat_minor} not recognized`
    );
  }

  throw new TypeError("This notebook format is not supported");
};
/**
 * Converts an immutable representation of a notebook to a JSON representation of the
 * notebook using the v4 of the nbformat specification.
 *
 * @param immnb The immutable representation of a notebook.
 *
 * @returns The JSON representation of a notebook.
 */
export const toJS = (immnb: ImmutableNotebook): v4.Notebook => {
  const minorVersion: null | number = immnb.get("nbformatMinor", null);

  if (
    immnb.get("nbformat") === 4 &&
    typeof minorVersion === "number" &&
    minorVersion >= 0
  ) {
    return v4.toJS(immnb);
  }
  throw new TypeError("Only notebook formats 3 and 4 are supported!");
};

/**
 * Converts a JSON representation of a notebook into a string representation.
 *
 * @param notebook The JSON representation of a notebook.
 *
 * @returns A string containing the notebook data.
 */
export const stringifyNotebook = (notebook: v4.Notebook) =>
  JSON.stringify(notebook, null, 2);
