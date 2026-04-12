export class Grass extends BaseEntityType {
  type = 'grass'

  protected createTraits() {
    return []
  }
}

registerEntityType(new Grass())
