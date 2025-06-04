// src/types/echarts.ts
import type { ComposeOption } from 'echarts/core';
import type { LineSeriesOption } from 'echarts/charts';
import type {
  GridComponentOption,
  TooltipComponentOption,
  MarkLineComponentOption,
  LegendComponentOption, // 🟡 이 부분이 추가되었는지 확인!
} from 'echarts/components'; // 🟡 from 'echarts/components' 경로 확인!

export type ECOption = ComposeOption<
  | LineSeriesOption
  | GridComponentOption
  | TooltipComponentOption
  | MarkLineComponentOption
  | LegendComponentOption // 🟡 이제 이 타입을 찾을 수 있을 거야!
>;