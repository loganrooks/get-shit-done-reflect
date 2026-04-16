'use strict';

const SESSION_SIZE_THRESHOLDS = Object.freeze({
  small_max: 5,
  medium_max: 20,
});

const DEFAULT_CLUSTER_WINDOW_SECONDS = 2;
const DEFAULT_MIN_CLUSTER_SIZE = 5;

function resolveMessageCount(session) {
  const dedupedCount = session && session.jsonl_usage && session.jsonl_usage.deduped_message_count;
  if (Number.isFinite(dedupedCount)) return dedupedCount;

  const fallbackCount = session && session.user_message_count;
  if (Number.isFinite(fallbackCount)) return fallbackCount;

  return null;
}

function classifySessionSize(session) {
  const count = resolveMessageCount(session);
  if (count === null) return { bucket: 'unknown', count: null };
  if (count <= SESSION_SIZE_THRESHOLDS.small_max) return { bucket: 'small', count };
  if (count <= SESSION_SIZE_THRESHOLDS.medium_max) return { bucket: 'medium', count };
  return { bucket: 'large', count };
}

function toMs(mtime) {
  if (typeof mtime === 'number') return mtime;
  if (mtime instanceof Date) return mtime.getTime();
  if (typeof mtime === 'string') return new Date(mtime).getTime();
  return Number.NaN;
}

function clusterByMtime(files, opts = {}) {
  const windowSeconds = Number.isFinite(opts.window_seconds) ? opts.window_seconds : DEFAULT_CLUSTER_WINDOW_SECONDS;
  const minClusterSize = Number.isFinite(opts.min_cluster_size) ? opts.min_cluster_size : DEFAULT_MIN_CLUSTER_SIZE;
  const windowMs = windowSeconds * 1000;

  if (!Array.isArray(files) || files.length === 0) return new Map();

  const sorted = files
    .filter(file => file && file.path && (typeof file.mtime === 'number' || file.mtime instanceof Date || typeof file.mtime === 'string'))
    .map(file => ({ path: file.path, mtime_ms: toMs(file.mtime) }))
    .filter(file => !Number.isNaN(file.mtime_ms))
    .sort((a, b) => (a.mtime_ms - b.mtime_ms) || String(a.path).localeCompare(String(b.path)));

  if (sorted.length === 0) return new Map();

  const clusters = [];
  let current = null;

  for (const file of sorted) {
    if (current && (file.mtime_ms - current.last_mtime_ms) <= windowMs) {
      current.files.push(file.path);
      current.last_mtime_ms = file.mtime_ms;
      continue;
    }

    if (current && current.files.length >= minClusterSize) {
      clusters.push(current);
    }

    current = {
      files: [file.path],
      first_mtime_ms: file.mtime_ms,
      last_mtime_ms: file.mtime_ms,
    };
  }

  if (current && current.files.length >= minClusterSize) {
    clusters.push(current);
  }

  const clusterMap = new Map();
  for (const cluster of clusters) {
    const clusterId = `cluster_${cluster.first_mtime_ms}_${cluster.files.length}`;
    clusterMap.set(clusterId, {
      cluster_id: clusterId,
      files: cluster.files,
      file_set: new Set(cluster.files),
      window_start: new Date(cluster.first_mtime_ms).toISOString(),
      window_end: new Date(cluster.last_mtime_ms).toISOString(),
      size: cluster.files.length,
      window_seconds: (cluster.last_mtime_ms - cluster.first_mtime_ms) / 1000,
    });
  }

  return clusterMap;
}

function classifyWritePath(filePath, clusterMap) {
  if (!clusterMap || clusterMap.size === 0) {
    return { write_path: 'single', cluster_id: null, cluster_size: null };
  }

  for (const [clusterId, cluster] of clusterMap.entries()) {
    if (cluster.file_set.has(filePath)) {
      return { write_path: 'bulk', cluster_id: clusterId, cluster_size: cluster.size };
    }
  }

  return { write_path: 'single', cluster_id: null, cluster_size: null };
}

function buildStratificationObject({ session, cluster_map, session_meta_path, has_facet }) {
  const size = classifySessionSize(session);
  const pathClassification = session_meta_path
    ? classifyWritePath(session_meta_path, cluster_map)
    : { write_path: 'single', cluster_id: null, cluster_size: null };

  return {
    write_path: pathClassification.write_path,
    facets_coverage_class: has_facet ? 'with' : 'without',
    size_bucket: size.bucket,
    cluster_id: pathClassification.cluster_id,
    user_message_count: size.count,
  };
}

module.exports = {
  SESSION_SIZE_THRESHOLDS,
  DEFAULT_CLUSTER_WINDOW_SECONDS,
  DEFAULT_MIN_CLUSTER_SIZE,
  classifySessionSize,
  clusterByMtime,
  classifyWritePath,
  buildStratificationObject,
};
