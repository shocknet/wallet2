import React, { useContext } from "react";

import Search from "../../Assets/Icons/search.png";
import { Ctx } from "../../Context";
import { SearchInputInterface } from "./types";

export const SearchInput: React.FC<SearchInputInterface> = ({ dispatch }): JSX.Element => {
  const state = useContext(Ctx)
  const { searching } = state
  const inputRef = React.useRef<HTMLInputElement>(null)
  const handleBlur = (): void => dispatch({ type: "SEARCH" })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: "SEARCHING", payload: e.target.value })
    if(!e.target.value){
      dispatch({ type: "FILTER", payload: "All items" })
    }
  }

  React.useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return(
    <div className="Search-input">
      <label htmlFor="search-field">
        <img src={Search} alt="" />
      </label>
      <input 
        type="text" 
        id="search-field" 
        placeholder="Search..." 
        ref={inputRef}
        onBlur={handleBlur}
        onChange={handleChange}
        defaultValue={searching}
      />
    </div>
  )
}