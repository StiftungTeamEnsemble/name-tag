// Browser configuration - uses Vite URL imports
import logoPdfUrl from "../assets/logo.pdf?url";
import geistRegularFontUrl from "../assets/fonts/Geist/ttf/Geist-Regular.ttf?url";
import geistSemiBoldFontUrl from "../assets/fonts/Geist/ttf/Geist-SemiBold.ttf?url";
import merriweatherRegularFontUrl from "../assets/fonts/Merriweather/ttf/Merriweather-Regular.ttf?url";
import {
  getLayoutConfig as getLayoutConfigBase,
  getAvailableLayouts as getAvailableLayoutsBase,
} from "./layouts.js";

export const assetPaths = {
  logo: logoPdfUrl,
  geistRegular: geistRegularFontUrl,
  geistSemiBold: geistSemiBoldFontUrl,
  merriweatherRegular: merriweatherRegularFontUrl,
};

export function getLayoutConfig(layoutName) {
  return getLayoutConfigBase(layoutName, assetPaths);
}

export function getAvailableLayouts() {
  return getAvailableLayoutsBase(assetPaths);
}
