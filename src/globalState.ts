import { StateInterface, ActionType, ItemInterface, ChangeQuantityInterface, RoutesInterface } from "./globalTypes"

export const initialState = (): StateInterface => {
  return {
    items: [],
    filteredItems: [],
    shoppingCart: [],
    categories: ["All items"],
    current: "/",
    history: "",
    searching: "",
    isSearching: false,
    filterAt: "All items",
    totalAmount: 0,
    error: false,
    loading: true
  }
}

export function reducer(state: StateInterface, action: ActionType): StateInterface{
  const { type, payload } = action
  let index: number | undefined;
  let newShoppingCart: ItemInterface[];
  let newItem: ItemInterface;

  const getIndex = () => {
    return state.items.findIndex(item => item.id === payload)
  }

  switch(type){
    case "RESET":
      return {
        ...state,
        shoppingCart: []
      }

    case "AMOUNT":
      return{
        ...state,
        totalAmount: payload as number
      }

    case "CHANGE_QUANTITY":
      index = state.shoppingCart.findIndex(
        item => item.id === (payload as ChangeQuantityInterface).id
      )
      newShoppingCart = [...state.shoppingCart]
      newShoppingCart[index].quantity = (payload as ChangeQuantityInterface).quantity

      return {
        ...state,
        shoppingCart: newShoppingCart
      }

    case "SEARCH":
      return{
        ...state,
        isSearching: !state.isSearching
      }
    case "MOVING":
      state.current = (payload as RoutesInterface).current;
      state.history = (payload as RoutesInterface).history
      return{ ...state }

    case "REMOVE":
      index = getIndex()
      newShoppingCart = state.shoppingCart.filter(product => product.id !== payload)
      state.items[index].added = false;
      return{ 
        ...state,
        shoppingCart: newShoppingCart
      }

    case "ADD_TO_CART":
      index = getIndex()
      if(index >= 0){
        newItem = state.items[index]
        newItem.quantity = 1
        newShoppingCart = [
          ...state.shoppingCart,
          newItem
        ]
      }else{
        newShoppingCart = state.shoppingCart
      }
      state.items[index].added = true;
      return{
        ...state,
        shoppingCart: newShoppingCart
      }

    case "SEARCHING":
      state.filteredItems = state.items.filter(item => {
        let searching: string = payload as string
        return item.title.toLowerCase().includes(searching.toLowerCase())
      })
      return{
        ...state,
        searching: payload as string
      }

    case "FILTER":
      state.filteredItems = payload === "All items" ? state.items : state.items.filter(item => item.category === payload)
      return{ ...state, filterAt: payload as string }

    case "ADD_INITIAL_ITEMS":
      (payload as ItemInterface[]).forEach((product: ItemInterface) => {
        if(!state.categories.includes(product.category)){
          state.categories.push(product.category)
        }
      })
      state.items = payload as ItemInterface[];
      state.filteredItems = state.items;
      return {
        ...state,
        loading: false
      }

    case "ERROR":
      return {
        ...state,
        error: true,
        loading: false
      }

    default:
      return { ...state }
  }
}