// @ts-nocheck
export function calculateQueuePositions(queue, averageSessionMinutes = 35) {
  return queue
    .filter((item) => item.status === 'waiting')
    .map((item, index) => ({
      ...item,
      position: index + 1,
      estimatedWaitMinutes: (index + 1) * averageSessionMinutes
    }));
}

