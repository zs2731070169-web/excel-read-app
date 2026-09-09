<script setup lang="ts">
import { computed, ref } from 'vue'

/** 展示所需的文件字段（浅 readonly 视图，来自 useLibrary 的 readonly state） */
type ReadonlyFile = {
  readonly id: string
  readonly fileName: string
  readonly firstImportedAt: number
  readonly importedAt: number
  readonly lastSheetName: string | null
}

const props = defineProps<{
  file: ReadonlyFile
  /** 当前处于展开删除态的文件 id（null=全部收起） */
  swipedId: string | null
}>()

const emit = defineEmits<{
  open: [id: string]
  delete: [id: string]
  /** 展开态变化（父级维护唯一展开） */
  swipe: [id: string | null]
}>()

const DELETE_WIDTH = 72 // 删除按钮宽度 px
const THRESHOLD = 36 // 落位判定阈值 px

/** 手势位移（拖动中实时值，null=非拖动） */
const dragging = ref<number | null>(null)

const expanded = computed(() => props.swipedId === props.file.id)

/** 内容层 translateX：拖动跟手 > 展开态 > 收起态 */
const translateX = computed(() => {
  if (dragging.value !== null) return Math.max(-DELETE_WIDTH, Math.min(0, dragging.value))
  return expanded.value ? -DELETE_WIDTH : 0
})

/** 拖动中禁用过渡（跟手），松手后启用（顺滑落位） */
const transitionOn = computed(() => dragging.value === null)

/** 手势起点 X 与起始位移 */
let touchStartX = 0
let startOffset = 0
/** 是否发生有效横向拖动（区分点击） */
let moved = false

function onTouchStart(e: TouchEvent) {
  const t = e.touches[0]
  touchStartX = t.clientX
  startOffset = expanded.value ? -DELETE_WIDTH : 0
  moved = false
}

function onTouchMove(e: TouchEvent) {
  const t = e.touches[0]
  const delta = t.clientX - touchStartX
  if (Math.abs(delta) > 6) moved = true
  dragging.value = startOffset + delta
}

function onTouchEnd() {
  const offset = dragging.value ?? 0
  dragging.value = null
  // 超过阈值（或从展开态往回收不超过一半）判定落位
  const shouldExpand = offset < -THRESHOLD
  emit('swipe', shouldExpand ? props.file.id : null)
}

function onClick() {
  if (moved) return // 拖动后的松手不算点击
  if (expanded.value) {
    // 展开态点击内容区 = 收起
    emit('swipe', null)
    return
  }
  emit('open', props.file.id)
}

function onClickDelete() {
  emit('delete', props.file.id)
}

/** 日期展示：天粒度 YYYY-MM-DD */
const dateLabel = computed(() => {
  const d = new Date(props.file.importedAt)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
})
</script>

<template>
  <div class="card-wrapper" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
    <!-- 右侧红色删除按钮（默认藏在内容层下，左滑露出） -->
    <button class="delete-btn" type="button" aria-label="删除此文件" @click.stop="onClickDelete">
      删除
    </button>

    <!-- 内容层（可滑动，点击进入工作簿） -->
    <div
      class="card"
      :class="{ dragging: !transitionOn }"
      :style="{ transform: `translateX(${translateX}px)` }"
      @click="onClick"
    >
      <div class="icon">XLSX</div>
      <div class="meta">
        <div class="name">{{ file.fileName }}</div>
        <div class="date">{{ dateLabel }}</div>
      </div>
      <van-icon name="arrow" class="arrow" />
    </div>
  </div>
</template>

<style scoped>
.card-wrapper {
  position: relative;
  overflow: hidden;
  margin: 0 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.delete-btn {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 72px;
  border: none;
  border-radius: 0 8px 8px 0;
  background: #ee0a24;
  color: #fff;
  font-size: 14px;
}

.card {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 12px;
  background: #fff;
  transition: transform 0.22s cubic-bezier(0.25, 0.8, 0.35, 1);
}

.card.dragging {
  transition: none; /* 跟手拖动不做过渡 */
}

.icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: #e8f3ff;
  color: #1677ff;
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 0.5px;
}

.meta {
  flex: 1;
  min-width: 0;
}

.name {
  font-size: 15px;
  color: #323233;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.date {
  margin-top: 4px;
  font-size: 12px;
  color: #969799;
}

.arrow {
  color: #c8c9cc;
  flex-shrink: 0;
}
</style>
