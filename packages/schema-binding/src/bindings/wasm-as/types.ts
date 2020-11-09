import * as Mapping from "./mapping";

export class TypeDefinition {
  constructor(
    public name: string,
    public type?: string,
    public required?: boolean
  ) { }
  public last: boolean | null = null
  public first: boolean | null = null
  public toMsgPack = Mapping.toMsgPack
  public toWasm = Mapping.toWasm
}

export class CustomTypeDefinition extends TypeDefinition {
  properties: PropertyDefinition[] = []
}

export abstract class UnknownTypeDefinition extends TypeDefinition {
  array: ArrayDefinition | null = null
  scalar: ScalarDefinition | null = null

  public abstract setTypeName(): void;
}

export class ScalarDefinition extends TypeDefinition {
  constructor(
    public name: string,
    public type: string,
    public required?: boolean
  ) {
    super(name, type, required);
  }
}

export class PropertyDefinition extends UnknownTypeDefinition {
  public setTypeName(): void {
    if (this.array) {
      this.array.setTypeName();
    }
  }
}

export class ArrayDefinition extends UnknownTypeDefinition {
  constructor(
    public name: string,
    public type: string,
    public required?: boolean
  ) {
    super(name, type, required);
  }

  public get item(): TypeDefinition {
    if (!this.array && !this.scalar) {
      throw Error("Array hasn't been configured yet");
    }

    if (this.array) {
      return this.array;
    } else {
      // @ts-ignore
      return this.scalar;
    }
  }

  public setTypeName(): void {
    let baseType = "";
    let baseTypeFound = false;
    let array: ArrayDefinition = this;

    while (!baseTypeFound) {
      if (array.array) {
        array = array.array;
        array.setTypeName();
      } else if (array.scalar) {
        baseType = array.scalar.type;
        baseTypeFound = true;
      }
    }

    const modifier = this.required ? "" : "?";
    this.type = modifier + "[" + this.item.type + "]";
  }
}

export class ImportDefinition {
  constructor(
    public uri: string,
    public namespace: string
  ) { }

  public types: ImportTypeDefinition[] = []
}

export class ImportTypeDefinition extends TypeDefinition {
  methods: MethodDefinition[] = []
}

export class MethodDefinition extends TypeDefinition {
  arguments: PropertyDefinition[] = []
  return: PropertyDefinition | null = null;
}

export class Config {
  types: CustomTypeDefinition[] = []
  imports: ImportDefinition[] = []

  public finalize() {
    setFirstLast(this.types);

    for (const type of this.types) {
      setFirstLast(type.properties);

      for (const prop of type.properties) {
        prop.setTypeName();
      }
    }

    for (const importEntry of this.imports) {
      setFirstLast(importEntry.types);

      for (const type of importEntry.types) {
        setFirstLast(type.methods);

        for (const method of type.methods) {
          setFirstLast(method.arguments);

          for (const argument of method.arguments) {
            argument.setTypeName();
          }
        }
      }
    }
  }
}

function setFirstLast(arr: {
  first: boolean | null,
  last: boolean | null
}[]) {
  if (arr.length > 0) {
    arr[0].first = true;
    arr[arr.length - 1].last = true;
  }
}