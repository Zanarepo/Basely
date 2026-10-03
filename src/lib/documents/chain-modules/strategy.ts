'use server'

import * as strategySynth from './strategy/strategy-synthesis'
import * as roadmapSynth from './strategy/roadmap-synthesis'
import * as okrSynth from './strategy/okr-synthesis'
import * as metricsSynth from './strategy/metrics-synthesis'
import * as retroSynth from './strategy/retro-synthesis'
import * as riskSynth from './strategy/risk-synthesis'

export async function synthesizeStrategyFromResearch(...args: Parameters<typeof strategySynth.synthesizeStrategyFromResearch>) {
  return strategySynth.synthesizeStrategyFromResearch(...args)
}

export async function synthesizeStrategyFromCharterAndScope(...args: Parameters<typeof strategySynth.synthesizeStrategyFromCharterAndScope>) {
  return strategySynth.synthesizeStrategyFromCharterAndScope(...args)
}

export async function synthesizeRoadmapFromStrategy(...args: Parameters<typeof roadmapSynth.synthesizeRoadmapFromStrategy>) {
  return roadmapSynth.synthesizeRoadmapFromStrategy(...args)
}

export async function draftPrioritizationFromStrategy(...args: Parameters<typeof roadmapSynth.draftPrioritizationFromStrategy>) {
  return roadmapSynth.draftPrioritizationFromStrategy(...args)
}

export async function draftPrioritizationFromOpportunities(...args: Parameters<typeof roadmapSynth.draftPrioritizationFromOpportunities>) {
  return roadmapSynth.draftPrioritizationFromOpportunities(...args)
}

export async function draftRoadmapFromPrioritization(...args: Parameters<typeof roadmapSynth.draftRoadmapFromPrioritization>) {
  return roadmapSynth.draftRoadmapFromPrioritization(...args)
}

export async function draftRoadmapFromPrd(...args: Parameters<typeof roadmapSynth.draftRoadmapFromPrd>) {
  return roadmapSynth.draftRoadmapFromPrd(...args)
}

export async function generateOkrsFromStrategy(...args: Parameters<typeof okrSynth.generateOkrsFromStrategy>) {
  return okrSynth.generateOkrsFromStrategy(...args)
}

export async function autoAlignRoadmapToOkrs(...args: Parameters<typeof okrSynth.autoAlignRoadmapToOkrs>) {
  return okrSynth.autoAlignRoadmapToOkrs(...args)
}

export async function generateOkrsFromProject(...args: Parameters<typeof okrSynth.generateOkrsFromProject>) {
  return okrSynth.generateOkrsFromProject(...args)
}

export async function generateNorthStarFromStrategy(...args: Parameters<typeof metricsSynth.generateNorthStarFromStrategy>) {
  return metricsSynth.generateNorthStarFromStrategy(...args)
}

export async function synthesizeLessonsLearned(...args: Parameters<typeof retroSynth.synthesizeLessonsLearned>) {
  return retroSynth.synthesizeLessonsLearned(...args)
}

export async function proposeStrategyUpdates(...args: Parameters<typeof retroSynth.proposeStrategyUpdates>) {
  return retroSynth.proposeStrategyUpdates(...args)
}

export async function synthesizeRiskRegisterFromCharterAndScope(...args: Parameters<typeof riskSynth.synthesizeRiskRegisterFromCharterAndScope>) {
  return riskSynth.synthesizeRiskRegisterFromCharterAndScope(...args)
}
