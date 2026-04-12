export class Sand extends BaseEntityType {
  type = 'sand'

  protected createTraits() {
    return []
  }
}

registerEntityType(new Sand())
