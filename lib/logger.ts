// Logger JSON terstruktur tanpa dependensi (aman di Node runtime + standalone, hindari risiko
// bundling pino). Output 1 baris JSON per event -> mudah diagregasi. Sertakan correlationId via meta.
type Level = 'debug' | 'info' | 'warn' | 'error'

function emit(level: Level, msg: string, meta?: Record<string, unknown>) {
  const line = JSON.stringify({ level, time: new Date().toISOString(), msg, ...meta })
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => emit('debug', msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => emit('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => emit('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => emit('error', msg, meta),
}
