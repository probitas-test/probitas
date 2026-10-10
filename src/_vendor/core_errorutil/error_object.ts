import { isString } from "../core_unknownutil/is/string.ts";
import { isRecord } from "../core_unknownutil/is/record.ts";
import { isObjectOf } from "../core_unknownutil/is/object_of.ts";
import { asOptional } from "../core_unknownutil/as/optional.ts";

/**
 * An error object is a serializable representation of an error
 */
export type ErrorObject = {
  /**
   * The name of the error prototype
   */
  proto: string;
  /**
   * The name of the error
   */
  name: string;
  /**
   * The error message
   */
  message: string;
  /**
   * The error stack
   */
  stack?: string;
  /**
   * Additional attributes
   */
  attributes: Record<string, unknown>;
};

/**
 * Check if a value is an error object
 */
export const isErrorObject: (x: unknown) => x is ErrorObject = isObjectOf({
  proto: isString,
  name: isString,
  message: isString,
  stack: asOptional(isString),
  attributes: isRecord,
});

/**
 * Convert an error to an error object
 */
export function toErrorObject(err: Error): ErrorObject {
  const { constructor, name, message, stack = undefined, ...rest } = err;
  return {
    proto: constructor.name,
    name,
    message,
    stack,
    attributes: rest,
  };
}

/**
 * Convert an error object to an error
 */
export function fromErrorObject(obj: ErrorObject): Error {
  return Object.assign(new Error(obj.message), {
    name: obj.name,
    stack: obj.stack,
    ...obj.attributes,
  });
}
