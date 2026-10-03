'use server'

import * as wbsGenerator from './ai/wbs-generator'
import * as backlogGenerator from './ai/backlog-generator'

export type { GeneratedEpic, GeneratedWP } from './ai/wbs-generator'

export async function generateWbsFromScope(...args: Parameters<typeof wbsGenerator.generateWbsFromScope>) {
  return wbsGenerator.generateWbsFromScope(...args)
}

export async function generateBacklogFromPrdAndRoadmap(...args: Parameters<typeof backlogGenerator.generateBacklogFromPrdAndRoadmap>) {
  return backlogGenerator.generateBacklogFromPrdAndRoadmap(...args)
}
