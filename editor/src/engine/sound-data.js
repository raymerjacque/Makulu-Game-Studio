export function soundSlotsForData(data) {
  return data.slots || (data.assetUrl ? [{ name: 'main', url: data.assetUrl, volume: 1, pitch: 1, loop: data.loop !== false, autoPlay: Boolean(data.autoPlay), overlap: false, startTime: 0, duration: null }] : []);
}

export function validateSoundData(data) {
  if (!data || typeof data !== 'object') throw new Error('Invalid sound data.');
  for (const field of ['volume', 'pitch', 'minDistance', 'refDistance', 'maxDistance', 'rollOffFactor']) {
    if (data[field] !== undefined && (!Number.isFinite(data[field]) || data[field] < 0)) throw new Error('Invalid sound settings.');
  }
  if (data.assetUrl !== undefined && data.assetUrl !== null && typeof data.assetUrl !== 'string') throw new Error('Invalid sound source.');
  if (data.distanceModel !== undefined && !['linear', 'inverse', 'exponential'].includes(data.distanceModel)) throw new Error('Invalid sound distance model.');
  for (const field of ['enabled', 'positional', 'loop', 'autoPlay']) if (data[field] !== undefined && typeof data[field] !== 'boolean') throw new Error('Invalid sound flag.');
  const slots = soundSlotsForData(data), names = new Set();
  if (!Array.isArray(slots) || slots.length > 64) throw new Error('Invalid sound slots.');
  for (const slot of slots) {
    if (!slot || typeof slot.name !== 'string' || !slot.name || slot.name.length > 128 || (['__proto__', 'constructor', 'prototype'].includes(slot.name) || Object.hasOwn(Object.prototype, slot.name)) || names.has(slot.name)) throw new Error('Invalid or duplicate sound-slot name.');
    names.add(slot.name);
    for (const field of ['loop', 'autoPlay', 'overlap']) if (slot[field] !== undefined && typeof slot[field] !== 'boolean') throw new Error('Invalid sound-slot flag.');
    if (slot.url != null && typeof slot.url !== 'string') throw new Error('Invalid audio URL.');
    for (const field of ['volume', 'pitch', 'startTime', 'duration']) if (slot[field] != null && (!Number.isFinite(slot[field]) || slot[field] < 0)) throw new Error('Invalid sound-slot parameter.');
  }
  return slots;
}

export function serializeSoundComponent(sound, assets) {
  const slots = Object.values(sound.slots || {}).map(slot => {
    const url = slot.name === 'main' && sound.assetUrl ? sound.assetUrl : sound._studioSlotSources?.[slot.name] || assets?.get(slot.asset)?.file?.url || null;
    if (slot.asset != null && !url) throw new Error(`Sound slot ${slot.name} has no recoverable source URL.`);
    return { name: slot.name, url, volume: slot.volume ?? 1, pitch: slot.pitch ?? 1,
      loop: slot.name === 'main' && sound.loop !== undefined ? sound.loop : Boolean(slot.loop),
      autoPlay: slot.name === 'main' && sound.autoPlay !== undefined ? sound.autoPlay : sound._studioSlotAutoPlay?.[slot.name] ?? Boolean(slot.autoPlay),
      overlap: Boolean(slot.overlap), startTime: slot.startTime ?? 0, duration: Object.hasOwn(sound._studioSlotDurations || {}, slot.name) ? sound._studioSlotDurations[slot.name] : (slot.duration > 0 ? slot.duration : null) };
  });
  const result = { enabled: sound.enabled !== false, volume: sound.volume ?? 1, pitch: sound.pitch ?? 1,
    positional: sound.positional !== false, minDistance: sound.minDistance ?? sound.refDistance ?? 1,
    maxDistance: sound.maxDistance ?? 15, rollOffFactor: sound.rollOffFactor ?? 1,
    distanceModel: sound.distanceModel || 'linear', assetUrl: sound.assetUrl || null,
    loop: sound.loop ?? slots.find(slot => slot.name === 'main')?.loop ?? true, autoPlay: sound.autoPlay ?? slots.find(slot => slot.name === 'main')?.autoPlay ?? false, slots };
  if (!slots.length && sound.assetUrl) result.slots = soundSlotsForData({ ...result, slots: undefined });
  validateSoundData(result);
  return result;
}

/** Retain desired playback flags while keeping imported editor audio silent until Play. */
export function applySoundSlot(sound, definition, asset, autoPlay = false) {
  sound._studioSlotSources ||= {};
  sound._studioSlotAutoPlay ||= {};
  sound._studioSlotDurations ||= {};
  sound._studioSlotSources[definition.name] = definition.url || null;
  sound._studioSlotAutoPlay[definition.name] = Boolean(definition.autoPlay);
  sound._studioSlotDurations[definition.name] = definition.duration ?? null;
  if (sound.slot(definition.name)) sound.removeSlot(definition.name);
  const slot = sound.addSlot(definition.name, { ...definition, autoPlay: autoPlay && Boolean(definition.autoPlay), ...(asset ? { asset: asset.id } : {}) });
  if (!slot) throw new Error('Sound slot could not be configured.');
  return slot;
}

export function queueSoundSlots(entity, data, app, session) {
  const definitions = validateSoundData(data), sound = entity.sound;
  const names = new Set(definitions.map(slot => slot.name));
  for (const name of Object.keys(sound.slots || {})) if (!names.has(name)) sound.removeSlot(name);
  sound.minDistance = sound.refDistance;
  sound.assetUrl = data.assetUrl || definitions.find(slot => slot.name === 'main')?.url || null;
  sound.loop = definitions.find(slot => slot.name === 'main')?.loop ?? data.loop ?? true;
  sound.autoPlay = definitions.find(slot => slot.name === 'main')?.autoPlay ?? data.autoPlay ?? false;
  for (const slot of definitions) {
    applySoundSlot(sound, slot, null, false);
    if (!slot.url) continue;
    session.add({ entityId: entity._studioId, entityName: entity.name, kind: `audio:${slot.name}` },
      done => { if (!app?.assets) done('no-asset-loader'); else app.assets.loadFromUrl(slot.url, 'audio', done); },
      (resource, asset) => { applySoundSlot(sound, slot, asset, false); });
  }
}

export const SOUND_RUNTIME_CODE = [soundSlotsForData, validateSoundData, applySoundSlot].map(fn => fn.toString()).join('\n');
