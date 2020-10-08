import { splatter } from './splatter';
export { splatter } from './splatter';
export { default as SoundUtility } from './sound_utils';
export * from './multi_time_vis';
import { renderTimeChannel } from './multi_time_vis';

window['splatter'] = splatter;
window['renderTimeChannel'] = renderTimeChannel;
