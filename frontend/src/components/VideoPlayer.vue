<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useAuth } from "@/composables/useAuth";
import { Loader2, AlertCircle, RefreshCw, Layers } from "lucide-vue-next";

const { user } = useAuth();

const props = defineProps({
  src: { type: String, required: true },
  mp4Src: { type: String, default: "" },
  hlsSrc: { type: String, default: "" },
  transcodeStatus: { type: String, default: "none" },
  title: { type: String, default: "Video" },
  poster: { type: String, default: "" },
  storageKey: { type: String, default: "" },
});

const emit = defineEmits(["ready"]);

// Phase 4: Standardized Playback States
// idle, loading, playing, buffering, switching_quality, recovering, fallback_mp4, error, ended
const playbackState = ref("idle");
const failed = ref(false);
const usingHlsFallback = ref(false);

// Phase 7: Development Playback Metrics
const playbackMetrics = ref({
  startupTimeMs: 0,
  firstFrameTimeMs: 0,
  bufferingCount: 0,
  bufferingDurationMs: 0,
  selectedQuality: "Auto",
  qualitySwitchCount: 0,
  fallbackCount: 0,
  fatalErrorCount: 0,
});

let startTime = 0;
let bufferStartTime = 0;

// Reset player states when film props change (Phase 5)
watch([() => props.src, () => props.hlsSrc, () => props.mp4Src], () => {
  usingHlsFallback.value = false;
  failed.value = false;
  playbackState.value = "idle";
  playbackMetrics.value = {
    startupTimeMs: 0,
    firstFrameTimeMs: 0,
    bufferingCount: 0,
    bufferingDurationMs: 0,
    selectedQuality: "Auto",
    qualitySwitchCount: 0,
    fallbackCount: 0,
    fatalErrorCount: 0,
  };
});

const mediaSrc = computed(() => {
  if (usingHlsFallback.value) {
    return props.mp4Src || props.src || "";
  }
  if (props.hlsSrc && props.transcodeStatus === "completed") {
    return props.hlsSrc;
  }
  return props.src || "";
});

const isYoutubeUrl = computed(() => {
  const url = mediaSrc.value || "";
  return url.includes("youtube.com") || url.includes("youtu.be");
});

const youtubeId = computed(() => {
  const url = mediaSrc.value || "";
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/,
  );
  return match ? match[1] : url;
});

const videoEl = ref(null);
let hls = null;
let plyr = null;
let saveInterval = null;

function lsKey() {
  const key = props.storageKey || mediaSrc.value;
  return key ? `pfspace:progress:${key}` : null;
}

onMounted(async () => {
  startTime = Date.now();
  playbackState.value = "loading";

  try {
    const [{ default: Plyr }, HlsModule] = await Promise.all([
      import("plyr"),
      import("hls.js"),
    ]);
    const Hls = HlsModule.default || HlsModule;

    if (isYoutubeUrl.value) {
      plyr = new Plyr(videoEl.value, {
        controls: [
          "play-large",
          "play",
          "progress",
          "current-time",
          "mute",
          "volume",
          "fullscreen",
        ],
        youtube: {
          noCookie: true,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          modestbranding: 1,
        },
      });
      playbackState.value = "playing";
      emit("ready");
      return;
    }

    const src = mediaSrc.value;
    const isHls = /\.m3u8($|\?)/i.test(src);

    plyr = new Plyr(videoEl.value, {
      ratio: "16:9",
      controls: [
        "play-large",
        "play",
        "progress",
        "current-time",
        "mute",
        "volume",
        "captions",
        "settings",
        "pip",
        "airplay",
        "fullscreen",
      ],
      invertTime: false,
      speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] },
      quality: { default: 0, options: [0] },
    });

    // Attach Event Listeners for State Tracking
    if (videoEl.value) {
      videoEl.value.addEventListener("playing", () => {
        if (playbackState.value === "loading" && startTime > 0) {
          playbackMetrics.value.startupTimeMs = Date.now() - startTime;
          playbackMetrics.value.firstFrameTimeMs = Date.now() - startTime;
        }
        if (playbackState.value === "buffering" && bufferStartTime > 0) {
          playbackMetrics.value.bufferingDurationMs += Date.now() - bufferStartTime;
          bufferStartTime = 0;
        }
        if (!usingHlsFallback.value) {
          playbackState.value = "playing";
        }
      });

      videoEl.value.addEventListener("waiting", () => {
        playbackState.value = "buffering";
        playbackMetrics.value.bufferingCount++;
        bufferStartTime = Date.now();
      });

      videoEl.value.addEventListener("ended", () => {
        playbackState.value = "ended";
      });
    }

    if (isHls) {
      if (Hls.isSupported()) {
        hls = new Hls({ autoStartLoad: true });
        hls.loadSource(src);
        hls.attachMedia(videoEl.value);

        // Phase 1: Adaptive Quality Intelligence & Manifest Parsed
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!hls || !plyr) return;
          const availableQualities = (hls.levels || [])
            .map((l) => l.height)
            .filter(Boolean);
          const qualities = [0, ...new Set(availableQualities)];

          const onQualityChange = (newQuality) => {
            if (!hls) return;
            const currentTime = videoEl.value?.currentTime || 0;
            playbackState.value = "switching_quality";
            playbackMetrics.value.qualitySwitchCount++;

            if (newQuality === 0) {
              hls.currentLevel = -1;
              playbackMetrics.value.selectedQuality = "Auto";
            } else {
              hls.levels.forEach((level, idx) => {
                if (level.height === newQuality) {
                  hls.currentLevel = idx;
                  playbackMetrics.value.selectedQuality = `${newQuality}p`;
                }
              });
            }

            // Phase 5: Preserve timestamp position during quality switch
            if (videoEl.value && currentTime > 0) {
              videoEl.value.currentTime = currentTime;
            }
          };

          if (plyr.config) {
            if (!plyr.config.i18n) plyr.config.i18n = {};
            plyr.config.i18n.qualityLabel = {
              0: "Auto",
              ...Object.fromEntries(availableQualities.map((q) => [q, `${q}p`])),
            };
            plyr.config.quality = {
              default: 0,
              options: qualities,
              forced: true,
              onChange: onQualityChange,
            };
            plyr.config.i18n.quality = "Kualitas";
            plyr.config.displayDuration = true;
          }

          if (plyr.options) {
            plyr.options.quality = qualities;
          }

          // Dynamically reveal Quality button tab in Plyr settings and fix badge text
          if (qualities.length > 1 && plyr.elements?.settings?.buttons?.quality) {
            plyr.elements.settings.buttons.quality.hidden = false;
            plyr.elements.settings.buttons.quality.removeAttribute("hidden");
            if (plyr.elements.settings.buttons.quality.parentElement) {
              plyr.elements.settings.buttons.quality.parentElement.hidden = false;
              plyr.elements.settings.buttons.quality.parentElement.removeAttribute("hidden");
            }

            // Fix 'undefined' badge text by immediately setting it to 'Auto'
            const valueBadge = plyr.elements.settings.buttons.quality.querySelector(".plyr__menu__value");
            if (valueBadge) {
              valueBadge.textContent = "Auto";
            }
          }

          // Populate Quality panel options in Plyr DOM
          const qualityPanel = plyr.elements?.settings?.panels?.quality;
          if (qualityPanel && qualities.length > 1) {
            const list = qualityPanel.querySelector('[role="menu"]');
            if (list) {
              list.innerHTML = "";
              qualities.forEach((q) => {
                const label = q === 0 ? "Auto" : `${q}p`;
                const button = document.createElement("button");
                button.type = "button";
                button.className = "plyr__control";
                button.setAttribute("role", "menuitemradio");
                button.setAttribute("aria-checked", q === 0 ? "true" : "false");
                button.value = String(q);
                button.innerHTML = `<span>${label}</span>`;
                button.addEventListener("click", () => {
                  list.querySelectorAll('[role="menuitemradio"]').forEach((b) => b.setAttribute("aria-checked", "false"));
                  button.setAttribute("aria-checked", "true");
                  const valueBadge = plyr.elements?.settings?.buttons?.quality?.querySelector(".plyr__menu__value");
                  if (valueBadge) valueBadge.textContent = label;
                  onQualityChange(q);
                });
                list.appendChild(button);
              });
            }
          }
        });

        // Track HLS level switched (Auto quality selection)
        hls.on(Hls.Events.LEVEL_SWITCHED, (evt, data) => {
          if (hls && hls.levels && hls.levels[data.level]) {
            const height = hls.levels[data.level].height;
            playbackMetrics.value.selectedQuality = `${height}p`;
          }
          if (playbackState.value === "switching_quality") {
            playbackState.value = "playing";
          }
        });

        // Phase 3: Playback Recovery Engine & Fatal Error Fallback
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (!data) return;
          if (data.fatal) {
            playbackMetrics.value.fatalErrorCount++;
            console.warn(
              "[VideoPlayer] HLS fatal error detected, executing seamless MP4 fallback:",
              data.type,
              data.details,
            );

            // Phase 5: Preserve current time position on fallback
            const savedTime = videoEl.value ? videoEl.value.currentTime : 0;

            if (hls && typeof hls.destroy === "function") {
              try { hls.destroy(); } catch {}
              hls = null;
            }

            usingHlsFallback.value = true;
            playbackState.value = "fallback_mp4";
            playbackMetrics.value.fallbackCount++;

            const fallbackSrc = props.mp4Src || props.src;
            if (videoEl.value && fallbackSrc) {
              videoEl.value.src = fallbackSrc;
              videoEl.value.load();
              if (savedTime > 0) {
                videoEl.value.currentTime = savedTime;
              }
              videoEl.value.play().catch(() => {});
            }
          } else {
            // Non-fatal recovery attempt
            playbackState.value = "recovering";
            try { hls.startLoad(); } catch {}
          }
        });
      } else if (videoEl.value && videoEl.value.canPlayType("application/vnd.apple.mpegurl")) {
        videoEl.value.src = src;
        playbackState.value = "playing";
      } else {
        usingHlsFallback.value = true;
        playbackState.value = "fallback_mp4";
        if (videoEl.value && (props.mp4Src || props.src)) {
          videoEl.value.src = props.mp4Src || props.src;
        }
      }
    } else if (videoEl.value) {
      videoEl.value.src = src || "";
    }

    const key = lsKey();
    if (key) {
      let raw = null;
      try {
        if (typeof localStorage !== "undefined" && typeof localStorage.getItem === "function") {
          raw = localStorage.getItem(key);
        }
      } catch {}
      const t = raw ? parseFloat(raw) : 0;
      if (!isNaN(t) && t > 5) {
        const setTime = () => {
          if (plyr && plyr.duration && t < plyr.duration - 5) {
            plyr.currentTime = t;
          }
          videoEl.value?.removeEventListener("loadedmetadata", setTime);
        };
        videoEl.value?.addEventListener("loadedmetadata", setTime);
      }
      saveInterval = setInterval(() => {
        if (!plyr || plyr.paused) return;
        try {
          if (typeof localStorage !== "undefined" && typeof localStorage.setItem === "function") {
            localStorage.setItem(key, String(plyr.currentTime || 0));
          }
        } catch {}
      }, 5000);
    }

    if (videoEl.value && videoEl.value.controlsList) {
      try {
        videoEl.value.controlsList.add("nodownload");
      } catch {}
    }

    emit("ready");
  } catch (e) {
    console.error("Init Plyr/HLS failed:", e);
    failed.value = true;
    playbackState.value = "error";
  }
});

onBeforeUnmount(() => {
  if (saveInterval) clearInterval(saveInterval);
  if (hls && typeof hls.destroy === "function") {
    try { hls.destroy(); } catch {}
  }
  if (plyr && typeof plyr.destroy === "function") {
    try { plyr.destroy(); } catch {}
  }
});

defineExpose({
  playbackState,
  playbackMetrics,
  usingHlsFallback,
});
</script>

<template>
  <div class="video-player-wrapper relative overflow-hidden bg-black rounded-xl">
    <!-- Playback Status Badge Overlay (UX Polish Phase 8) -->
    <div
      v-if="usingHlsFallback || playbackState === 'buffering' || playbackState === 'switching_quality' || playbackState === 'recovering'"
      class="absolute top-3 left-3 z-20 flex items-center gap-2 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md border border-stone-800 text-xs font-mono select-none"
    >
      <Loader2
        v-if="playbackState === 'buffering' || playbackState === 'switching_quality' || playbackState === 'recovering'"
        class="w-3.5 h-3.5 text-amber-400 animate-spin"
      />
      <AlertCircle v-else-if="usingHlsFallback" class="w-3.5 h-3.5 text-amber-400" />

      <span v-if="playbackState === 'buffering'" class="text-amber-300">Buffering...</span>
      <span v-else-if="playbackState === 'switching_quality'" class="text-sky-300">Switching Quality...</span>
      <span v-else-if="playbackState === 'recovering'" class="text-amber-300">Recovering Stream...</span>
      <span v-else-if="usingHlsFallback" class="text-stone-300">MP4 Fallback Mode</span>
    </div>

    <!-- YouTube Embed -->
    <div v-if="isYoutubeUrl" class="aspect-video w-full">
      <div
        ref="videoEl"
        :data-plyr-provider="'youtube'"
        :data-plyr-embed-id="youtubeId"
      ></div>
    </div>

    <!-- Standard / HLS Video Element -->
    <div v-else class="aspect-video w-full bg-black">
      <video
        ref="videoEl"
        class="plyr-video w-full h-full object-contain"
        playsinline
        controls
        :poster="poster"
      ></video>
    </div>
  </div>
</template>

<style scoped>
.video-player-wrapper {
  aspect-ratio: 16 / 9;
  width: 100%;
  height: 100%;
}

:deep(.plyr) {
  aspect-ratio: 16 / 9 !important;
  width: 100% !important;
  height: 100% !important;
  max-height: 100% !important;
}

:deep(.plyr__video-wrapper) {
  aspect-ratio: 16 / 9 !important;
  width: 100% !important;
  height: 100% !important;
}

:deep(.plyr__poster) {
  background-size: contain !important;
  background-position: center !important;
  background-repeat: no-repeat !important;
}

:deep(.plyr video) {
  object-fit: contain !important;
  width: 100% !important;
  height: 100% !important;
}
</style>
