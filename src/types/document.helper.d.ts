import type {
  Document,
  HydratedDocument,
  LeanDocument,
  QueryOptions,
  QueryWithHelpers,
  Types
} from "mongoose";

type HasLean<
  Doc extends Document,
  O extends QueryOptions<Doc> | unknown
> = O extends QueryOptions<Doc>
  ? O["lean"] extends true
    ? true
    : false
  : false;

export type FindResult<
  T extends Document,
  Opts extends QueryOptions<T> | unknown = undefined,
  // Need to kinda toggle this type condition
  Doc = HasLean<T, Opts> extends true ? LeanDocument<T> : HydratedDocument<T>
> = QueryWithHelpers<
  | (Doc & {
      _id: Types.ObjectId;
    })
  | null,
  Doc & {
    _id: Types.ObjectId;
  }
>;

export type FindResultExec<
  T extends Document,
  Opts extends QueryOptions<T> | unknown = undefined,
  // Need to kinda toggle this type condition
  Doc = HasLean<T, Opts> extends true ? LeanDocument<T> : HydratedDocument<T>
> = Promise<
  | (Doc & {
      _id: Types.ObjectId;
    })
  | null
>;
