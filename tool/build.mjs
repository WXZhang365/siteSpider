import * as child_process from 'child_process'
import { readFileSync } from 'fs'

const { spawnSync } = child_process
const pack = JSON.parse(readFileSync('package.json', 'utf-8'))

spawnSync('docker', ['build', '.', '-t', `${pack.name}:${pack.version}`], {
  encoding: 'utf-8',
  stdio: 'inherit',
})
