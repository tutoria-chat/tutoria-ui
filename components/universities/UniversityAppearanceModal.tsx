'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { RotateCcw, Send, Bot, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface UniversityAppearanceModalProps {
  open: boolean;
  onClose: () => void;
  universityId: number;
  universityName: string;
  initialPrimaryColor?: string;
  initialSecondaryColor?: string;
  initialDefaultTheme?: string;
  initialBubbleOpacity?: number;
  onSave: (data: {
    widgetPrimaryColor: string | null;
    widgetSecondaryColor: string | null;
    widgetDefaultTheme: string;
    widgetBubbleOpacity: number | null;
  }) => Promise<void>;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const PRESET_SWATCHES = [
  '#7C3AED', // purple
  '#2563EB', // blue
  '#16A34A', // green
  '#DC2626', // red
  '#EA580C', // orange
  '#0D9488', // teal
  '#DB2777', // pink
  '#4F46E5', // indigo
];

const DEFAULT_PRIMARY = '#7C3AED';
const DEFAULT_SECONDARY_LIGHT = '#F3F4F6';
const THEME_OPTIONS = ['light', 'dark', 'auto'] as const;
type ThemeOption = typeof THEME_OPTIONS[number];

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns true if the given hex color is "dark" (luminance < 0.5),
 * so we know whether to use white or black text on top of it.
 */
function isColorDark(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return false;
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  // Relative luminance (WCAG formula)
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return luminance < 0.179; // threshold for contrast
}

function isValidHex(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

/** Convert a #RRGGBB hex + opacity percent (0–100) into an rgba() string. */
function hexToRgba(hex: string, opacityPercent: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const a = Math.max(0, Math.min(100, opacityPercent)) / 100;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// ─── Color Picker Row ───────────────────────────────────────────────────────

interface ColorPickerRowProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  placeholder?: string;
}

function ColorPickerRow({ label, value, onChange, placeholder }: ColorPickerRowProps) {
  const [textValue, setTextValue] = useState(value);

  // Keep textValue in sync when parent value changes (e.g., reset)
  React.useEffect(() => {
    setTextValue(value);
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setTextValue(raw);
    // Ensure leading # and validate before propagating
    const withHash = raw.startsWith('#') ? raw : `#${raw}`;
    if (isValidHex(withHash)) {
      onChange(withHash);
    } else if (isValidHex(raw)) {
      onChange(raw);
    }
  };

  const handleNativeColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setTextValue(e.target.value);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        {/* Native color picker */}
        <label className="relative cursor-pointer">
          <span
            className="block h-9 w-9 rounded-md border border-input shadow-sm"
            style={{ backgroundColor: isValidHex(value) ? value : '#7C3AED' }}
          />
          <input
            type="color"
            value={isValidHex(value) ? value : '#7C3AED'}
            onChange={handleNativeColorChange}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>

        {/* Hex text input */}
        <input
          type="text"
          value={textValue}
          onChange={handleTextChange}
          placeholder={placeholder || '#000000'}
          maxLength={7}
          className="h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm font-mono shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      {/* Preset swatches */}
      <div className="flex flex-wrap gap-1.5">
        {PRESET_SWATCHES.map((swatch) => (
          <button
            key={swatch}
            type="button"
            onClick={() => {
              onChange(swatch);
              setTextValue(swatch);
            }}
            title={swatch}
            className="h-6 w-6 rounded-full border-2 transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{
              backgroundColor: swatch,
              borderColor: value === swatch ? 'white' : 'transparent',
              boxShadow: value === swatch ? `0 0 0 2px ${swatch}` : 'none',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Live Widget Preview ─────────────────────────────────────────────────────

interface WidgetPreviewProps {
  universityName: string;
  primaryColor: string;
  secondaryColor: string;
  theme: ThemeOption;
  bubbleOpacity: number;
}

function WidgetPreview({ universityName, primaryColor, secondaryColor, theme, bubbleOpacity }: WidgetPreviewProps) {
  // Resolve effective theme for the preview (auto → light)
  const effectiveTheme = theme === 'auto' ? 'light' : theme;
  const isDark = effectiveTheme === 'dark';

  const validPrimary = isValidHex(primaryColor) ? primaryColor : DEFAULT_PRIMARY;
  const validSecondary = isValidHex(secondaryColor) ? secondaryColor : (isDark ? '#374151' : DEFAULT_SECONDARY_LIGHT);

  const primaryTextColor = isColorDark(validPrimary) ? '#FFFFFF' : '#111827';
  const secondaryTextColor = isColorDark(validSecondary) ? '#F9FAFB' : '#111827';

  // Message-bubble backgrounds honor the configured opacity (text stays opaque).
  const userBubbleBg = hexToRgba(validPrimary, bubbleOpacity);
  const agentBubbleBg = hexToRgba(validSecondary, bubbleOpacity);

  // Theme tokens
  const bg = isDark ? '#111827' : '#FFFFFF';
  const headerBg = isDark ? '#1F2937' : '#F9FAFB';
  const border = isDark ? '#374151' : '#E5E7EB';
  const inputBg = isDark ? '#1F2937' : '#F3F4F6';
  const inputText = isDark ? '#9CA3AF' : '#6B7280';
  const headerText = isDark ? '#F9FAFB' : '#111827';
  const footerBg = isDark ? '#1F2937' : '#F9FAFB';

  return (
    <div className="sticky top-0">
      <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Preview
      </p>
      <div
        className="mx-auto w-full max-w-[280px] overflow-hidden rounded-2xl shadow-xl"
        style={{ backgroundColor: bg, border: `1px solid ${border}` }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2 px-3 py-2.5"
          style={{ backgroundColor: headerBg, borderBottom: `1px solid ${border}` }}
        >
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: validPrimary }}
          >
            <Bot className="h-3.5 w-3.5" style={{ color: primaryTextColor }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold" style={{ color: headerText }}>
              {universityName || 'TutorIA'}
            </p>
            <p className="text-[10px]" style={{ color: isDark ? '#6B7280' : '#9CA3AF' }}>
              Online
            </p>
          </div>
        </div>

        {/* Chat body */}
        <div className="flex flex-col gap-2 px-3 py-3" style={{ minHeight: 160 }}>
          {/* Agent message */}
          <div className="flex items-end gap-1.5">
            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: validPrimary }}
            >
              <Bot className="h-2.5 w-2.5" style={{ color: primaryTextColor }} />
            </div>
            <div
              className="max-w-[75%] rounded-2xl rounded-bl-sm px-2.5 py-1.5 text-[11px] leading-snug"
              style={{ backgroundColor: agentBubbleBg, color: secondaryTextColor }}
            >
              Hello! How can I help you today?
            </div>
          </div>

          {/* User message */}
          <div className="flex items-end justify-end gap-1.5">
            <div
              className="max-w-[75%] rounded-2xl rounded-br-sm px-2.5 py-1.5 text-[11px] leading-snug"
              style={{ backgroundColor: userBubbleBg, color: primaryTextColor }}
            >
              What topics are on the exam?
            </div>
            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: isDark ? '#374151' : '#E5E7EB' }}
            >
              <User className="h-2.5 w-2.5" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }} />
            </div>
          </div>

          {/* Agent response */}
          <div className="flex items-end gap-1.5">
            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: validPrimary }}
            >
              <Bot className="h-2.5 w-2.5" style={{ color: primaryTextColor }} />
            </div>
            <div
              className="max-w-[75%] rounded-2xl rounded-bl-sm px-2.5 py-1.5 text-[11px] leading-snug"
              style={{ backgroundColor: agentBubbleBg, color: secondaryTextColor }}
            >
              Based on the course materials, chapters 3–5 are the key focus areas.
            </div>
          </div>
        </div>

        {/* Input footer */}
        <div
          className="flex items-center gap-2 px-2 py-2"
          style={{ backgroundColor: footerBg, borderTop: `1px solid ${border}` }}
        >
          <div
            className="flex-1 rounded-full px-3 py-1.5 text-[11px]"
            style={{ backgroundColor: inputBg, color: inputText }}
          >
            Type a message...
          </div>
          <button
            type="button"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-80"
            style={{ backgroundColor: validPrimary }}
          >
            <Send className="h-3 w-3" style={{ color: primaryTextColor }} />
          </button>
        </div>
      </div>

      {/* Theme badge */}
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        {theme === 'auto'
          ? 'Preview shown in light mode (auto adapts to system)'
          : `${theme.charAt(0).toUpperCase() + theme.slice(1)} mode preview`}
      </p>
    </div>
  );
}

// ─── Main Modal ─────────────────────────────────────────────────────────────

export function UniversityAppearanceModal({
  open,
  onClose,
  universityId: _universityId,
  universityName,
  initialPrimaryColor,
  initialSecondaryColor,
  initialDefaultTheme,
  initialBubbleOpacity,
  onSave,
}: UniversityAppearanceModalProps) {
  const t = useTranslations('universities');

  const [primaryColor, setPrimaryColor] = useState(initialPrimaryColor || DEFAULT_PRIMARY);
  const [secondaryColor, setSecondaryColor] = useState(initialSecondaryColor || DEFAULT_SECONDARY_LIGHT);
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>(
    (initialDefaultTheme as ThemeOption) || 'light'
  );
  const [bubbleOpacity, setBubbleOpacity] = useState(initialBubbleOpacity ?? 100);
  const [saving, setSaving] = useState(false);

  // Reset local state when modal opens with new initialValues
  React.useEffect(() => {
    if (open) {
      setPrimaryColor(initialPrimaryColor || DEFAULT_PRIMARY);
      setSecondaryColor(initialSecondaryColor || DEFAULT_SECONDARY_LIGHT);
      setSelectedTheme((initialDefaultTheme as ThemeOption) || 'light');
      setBubbleOpacity(initialBubbleOpacity ?? 100);
    }
  }, [open, initialPrimaryColor, initialSecondaryColor, initialDefaultTheme, initialBubbleOpacity]);

  const handleResetDefaults = useCallback(() => {
    setPrimaryColor(DEFAULT_PRIMARY);
    setSecondaryColor(DEFAULT_SECONDARY_LIGHT);
    setBubbleOpacity(100);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        widgetPrimaryColor: isValidHex(primaryColor) ? primaryColor : null,
        widgetSecondaryColor: isValidHex(secondaryColor) ? secondaryColor : null,
        widgetDefaultTheme: selectedTheme,
        widgetBubbleOpacity: bubbleOpacity,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const themeLabels: Record<ThemeOption, string> = {
    light: t('appearance.themeLight'),
    dark: t('appearance.themeDark'),
    auto: t('appearance.themeAuto'),
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('appearance.title')}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {t('appearance.description', { name: universityName })}
          </p>
        </DialogHeader>

        {/* Two-column layout: controls | preview */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* ── Left: Controls ── */}
          <div className="space-y-6">
            {/* Primary color */}
            <ColorPickerRow
              label={t('appearance.primaryColorLabel')}
              value={primaryColor}
              onChange={setPrimaryColor}
              placeholder="#7C3AED"
            />

            {/* Secondary color */}
            <ColorPickerRow
              label={t('appearance.secondaryColorLabel')}
              value={secondaryColor}
              onChange={setSecondaryColor}
              placeholder="#F3F4F6"
            />

            {/* Default theme */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t('appearance.defaultThemeLabel')}
              </Label>
              <div className="flex gap-2">
                {THEME_OPTIONS.map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => setSelectedTheme(theme)}
                    className={[
                      'flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-all',
                      selectedTheme === theme
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background hover:bg-accent hover:text-accent-foreground',
                    ].join(' ')}
                  >
                    {themeLabels[theme]}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('appearance.defaultThemeHelp')}
              </p>
            </div>

            {/* Chat bubble opacity */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{t('appearance.bubbleOpacityLabel')}</Label>
                <span className="text-sm font-medium tabular-nums text-muted-foreground">{bubbleOpacity}%</span>
              </div>
              <input
                type="range"
                min={20}
                max={100}
                step={5}
                value={bubbleOpacity}
                onChange={(e) => setBubbleOpacity(Number(e.target.value))}
                className="w-full accent-primary"
                aria-label={t('appearance.bubbleOpacityLabel')}
              />
              <p className="text-xs text-muted-foreground">{t('appearance.bubbleOpacityHelp')}</p>
            </div>

            {/* Reset to defaults */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetDefaults}
              className="w-full"
            >
              <RotateCcw className="mr-2 h-3.5 w-3.5" />
              {t('appearance.resetDefaults')}
            </Button>
          </div>

          {/* ── Right: Preview ── */}
          <WidgetPreview
            universityName={universityName}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            theme={selectedTheme}
            bubbleOpacity={bubbleOpacity}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t('form.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                {t('appearance.saving')}
              </>
            ) : (
              t('appearance.save')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
