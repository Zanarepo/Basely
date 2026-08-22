import { generateClosureSynthesis } from './src/lib/documents/ai-closure-actions'

async function run() {
  console.log('Testing generateClosureSynthesis...')
  // Using the projectId from the URL in previous screenshots (ff0cf0ec-072e-42fc-bcd2-efd1ed2fbcb3)
  const res = await generateClosureSynthesis('ff0cf0ec-072e-42fc-bcd2-efd1ed2fbcb3', 'lessons_learned')
  console.log(JSON.stringify(res, null, 2))
}

run()
