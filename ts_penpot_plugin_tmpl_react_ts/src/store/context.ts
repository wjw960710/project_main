import {createSignal} from "react-alien-signals";
import type {Theme} from "@penpot/plugin-types";

export const theme = createSignal<Theme>('light')