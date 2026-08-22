import { DocumentItem } from './types'
import { productStrategyDocs } from './productSuite/productStrategyDocs'
import { productRequirementsDocs } from './productSuite/productRequirementsDocs'
import { productPrioritizationExecutionDocs } from './productSuite/productPrioritizationExecutionDocs'
import { commonDocs } from './commonDocs'

export const PRODUCT_SUITE_DOCS: DocumentItem[] = [
  ...productStrategyDocs,
  ...productRequirementsDocs,
  ...productPrioritizationExecutionDocs,
  ...commonDocs,
]
