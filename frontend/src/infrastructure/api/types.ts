export interface Attribute {
  code: string
  name: string
  groupCode: string
  dataTypeCode: string
  required: boolean
  unique: boolean
  nullable: boolean
  defaultValue: string | null
  unit: string | null
}
