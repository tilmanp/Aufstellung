/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PositionCategory = "Tor" | "Abwehr" | "Mittelfeld" | "Sturm" | "Trainer";

export interface Player {
  id: string;
  name: string;
  category: PositionCategory;
  club?: string;
  number?: number;
  image?: string;
  clubLogoUrl?: string;
  clubFallbackUrl?: string;
}

export interface FieldPosition {
  id: string;
  category: PositionCategory;
  top: number; // Percent
  left: number; // Percent
  label: string;
}

export type FormationType = "4-4-2" | "4-2-3-1" | "3-4-3" | "4-3-3" | "3-5-2";

export interface Formation {
  name: FormationType;
  positions: FieldPosition[];
}
