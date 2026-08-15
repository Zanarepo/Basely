import { DocumentItem } from './types'
import { initiationDocs } from './projectSuite/initiationDocs'
import { planningDocs } from './projectSuite/planningDocs'
import { executionDocs } from './projectSuite/executionDocs'
import { closureDocs } from './projectSuite/closureDocs'

export const PROJECT_SUITE_DOCS: DocumentItem[] = [
  ...initiationDocs,
  ...planningDocs,
  ...executionDocs,
  ...closureDocs,
]
