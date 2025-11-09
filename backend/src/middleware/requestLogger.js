/**
 * Simple request logger middleware
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log when response is finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    };

    // Color code by status
    const statusColor = res.statusCode >= 500 ? '\x1b[31m' : // red
                       res.statusCode >= 400 ? '\x1b[33m' : // yellow
                       res.statusCode >= 300 ? '\x1b[36m' : // cyan
                       '\x1b[32m'; // green
    const reset = '\x1b[0m';

    console.log(
      `${log.timestamp} ${log.method} ${log.path} ${statusColor}${log.status}${reset} ${log.duration}`
    );
  });

  next();
};
