import fs from 'fs/promises'

export const loggerService = {
  detoy(...args) {
    return doLog('DEtoy', ...args)
  },
  info(...args) {
    return doLog('INFO', ...args)
  },
  warn(...args) {
    return doLog('WARN', ...args)
  },
  error(...args) {
    return doLog('ERROR', ...args)
  }
}

const logsDir = './logs'

async function ensureLogsDir() {
  try {
    await fs.access(logsDir)
  } catch {
    await fs.mkdir(logsDir)
  }
}

ensureLogsDir()

//define the time format
function getTime() {
  let now = new Date()
  return now.toLocaleString('he')
}

function isError(e) {
  return e && e.stack && e.message
}

async function doLog(level, ...args) {
  const strs = args.map((arg) => (typeof arg === 'string' || isError(arg) ? arg : JSON.stringify(arg)))
  let line = strs.join(' | ')
  line = `${getTime()} - ${level} - ${line}\n`

  console.log(line)

  try {
    await fs.appendFile(`${logsDir}/backend.log`, line)
  } catch (err) {
    console.error('FATAL: cannot write to log file', err)
  }
}
