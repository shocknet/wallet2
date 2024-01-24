import { useEffect, MutableRefObject } from 'react';






const useClickOutside = (
  refs: MutableRefObject<HTMLElement | null>[],
  callback: () => void,
  preventScrolling = true,
  additionalChecks?: boolean[] 
  ) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const optionalChecks = !additionalChecks || additionalChecks.every(flag => flag);

      const isOutside = refs.every(ref => {
        return ref.current && !ref.current.contains(event.target as Node);
      })

      if (isOutside && optionalChecks) {
        callback();
      }
    }

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside, true);
    });
  
    
    if (preventScrolling) {
      document.body.classList.add("no-scroll");
    }

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside, true);
			document.body.classList.remove("no-scroll");
    };
  }, [additionalChecks, callback, refs, preventScrolling]);
}

export default useClickOutside;