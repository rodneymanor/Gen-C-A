const FALLBACK_DURATION_SECONDS = 30;

const isValidUrl = (value) => {
  if (!value || typeof value !== 'string') {
    return false;
  }

  try {
    const next = new URL(value);
    return next.protocol === 'http:' || next.protocol === 'https:';
  } catch {
    return false;
  }
};

const coerceNumber = (input, defaultValue = 0) => {
  if (typeof input === 'number' && Number.isFinite(input)) {
    return input;
  }
  if (typeof input === 'string') {
    const parsed = Number(input);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  }
  return defaultValue;
};

const extractVideoVersions = (reel) => {
  if (Array.isArray(reel?.video_versions) && reel.video_versions.length > 0) {
    return reel.video_versions;
  }
  if (Array.isArray(reel?.video?.video_versions) && reel.video.video_versions.length > 0) {
    return reel.video.video_versions;
  }
  return [];
};

const extractThumbnailCandidates = (reel) => {
  if (Array.isArray(reel?.image_versions2?.candidates)) {
    return reel.image_versions2.candidates;
  }
  if (Array.isArray(reel?.image_versions2?.additional_candidates)) {
    return Object.values(reel.image_versions2.additional_candidates).filter(Boolean);
  }
  if (Array.isArray(reel?.cover_frame_url)) {
    return reel.cover_frame_url;
  }
  return [];
};

const pickThumbnail = (candidates) => {
  for (const candidate of candidates) {
    const url = candidate?.url;
    if (isValidUrl(url)) {
      return url;
    }
  }
  return undefined;
};

const buildVideoData = (reel, username, index) => {
  const versions = extractVideoVersions(reel);
  if (!versions.length) {
    return null;
  }

  const primaryVersion = versions[0];
  const candidateUrl = primaryVersion?.url;

  if (!isValidUrl(candidateUrl)) {
    return null;
  }

  const thumbnailCandidates = extractThumbnailCandidates(reel);
  const thumbnailUrl = pickThumbnail(thumbnailCandidates);
  const caption = reel?.caption?.text ?? reel?.caption ?? '';
  const duration = coerceNumber(reel?.video_duration, FALLBACK_DURATION_SECONDS);
  const quality = `${primaryVersion?.width ?? ''}x${primaryVersion?.height ?? ''}`.trim();
  const author = reel?.user?.username ?? reel?.user?.full_name ?? username;

  return {
    id: String(reel?.pk ?? reel?.id ?? `instagram_${username}_${index}_${Date.now()}`),
    platform: 'instagram',
    videoUrl: candidateUrl,
    downloadUrl: candidateUrl,
    playUrl: candidateUrl,
    thumbnailUrl,
    viewCount: coerceNumber(reel?.play_count ?? reel?.view_count),
    likeCount: coerceNumber(reel?.like_count),
    quality: quality || 'unknown',
    title: caption || `Instagram Reel ${index + 1}`,
    description: caption,
    author,
    duration,
  };
};

const extractProfileFromReel = (reel) => {
  const info = reel?.media?.user ?? reel?.user ?? reel?.media?.owner;
  if (!info) {
    return undefined;
  }

  const bio = info.biography || info.bio || undefined;
  let externalUrl = info.external_url;
  if (!externalUrl && typeof bio === 'string') {
    const match = bio.match(/(https?:\/\/[^\s]+)/);
    if (match) {
      externalUrl = match[1];
    }
  }

  return {
    profileImageUrl:
      info.profile_pic_url || info.profile_picture || info.profile_pic_url_hd || info.hd_profile_pic_url_info?.url,
    displayName: info.full_name || info.display_name || info.username,
    bio,
    followersCount: coerceNumber(info.follower_count ?? info.followers_count ?? info.edge_followed_by?.count),
    followingCount: coerceNumber(info.following_count ?? info.followings_count ?? info.edge_follow?.count),
    postsCount: coerceNumber(info.media_count ?? info.posts_count ?? info.edge_owner_to_timeline_media?.count),
    isVerified: Boolean(info.is_verified ?? info.verified),
    isPrivate: Boolean(info.is_private ?? info.private),
    externalUrl: externalUrl ?? undefined,
    category: info.category ?? info.business_category_name ?? undefined,
  };
};

export function processInstagramReels(items, username, limit) {
  const normalizedItems = Array.isArray(items) ? items : [];
  const cappedItems = typeof limit === 'number' && limit > 0 ? normalizedItems.slice(0, limit) : normalizedItems;

  const processedVideos = [];
  let profileData;

  cappedItems.forEach((item, index) => {
    const media = item?.media ?? item;
    if (!media || (media.media_type !== 2 && !media.video_versions && !media?.video?.video_versions)) {
      return;
    }

    if (!profileData) {
      profileData = extractProfileFromReel(item);
    }

    const videoData = buildVideoData(media, username ?? media?.user?.username ?? 'instagram', index);
    if (videoData) {
      processedVideos.push(videoData);
    }
  });

  return {
    videos: processedVideos,
    profileData,
    totalFound: normalizedItems.length,
    rawItems: cappedItems,
  };
}
