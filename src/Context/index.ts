import React, { createContext } from "react";
import { initialState } from "../globalState";
import { StateInterface } from "../globalTypes";

export const Ctx: React.Context<StateInterface> = createContext(initialState())