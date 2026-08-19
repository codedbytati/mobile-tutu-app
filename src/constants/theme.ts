/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import "@/global.css";

import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#15131C",
    background: "#F7F4FF",
    ink: "#15131C",
    accent: "#B8A7FF",
    success: "#2ED39B",
    danger: "#FF837A",
    border: "#E7E2F3",
    backgroundElement: "#FFFFFF",
    backgroundSelected: "#DCD2FF",
    textSecondary: "#9993AB",
    highlight: "#F6D96B",
    barEmpty: "#EEEAF2",
  },
  dark: {
    text: "#FFFFFF",
    background: "#1B1824",
    backgroundElement: "#212225",
    backgroundSelected: "#2E3135",
    textSecondary: "#B9B2C9",
    ink: "#FFFFFF",
    accent: "#B8A7FF",
    success: "#52E0B0",
    danger: "#FF9B93",
    border: "#383342",
    highlight: "#F6D96B",
    barEmpty: "#393442",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: "Poppins_400Regular",
    serif: "Poppins_400Regular",
    rounded: "Poppins_600SemiBold",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "Poppins_400Regular",
    serif: "Poppins_400Regular",
    rounded: "Poppins_600SemiBold",
    mono: "monospace",
  },
  web: {
    sans: "Poppins",
    serif: "Poppins",
    rounded: "Poppins",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
