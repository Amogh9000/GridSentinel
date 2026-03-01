// replay.worker.ts
const ctx: Worker = self as any;

let replayData: any[] = [];

ctx.onmessage = (e) => {
    const { type, data } = e.data;

    if (type === 'LOAD_REPLAY') {
        replayData = data;
    }

    if (type === 'SEEK_TIME') {
        const time = data;
        // Interpolation logic would go here
        const state = replayData.find(d => d.time >= time) || replayData[replayData.length - 1];
        ctx.postMessage({ type: 'REPLAY_STATE', data: state });
    }
};
