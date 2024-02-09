import { useEffect } from 'react';

//It import svg icons library
import * as Icons from "../../Assets/SvgIconLibrary";
import { useIonRouter } from '@ionic/react';

export const Loader = () => {
  const router = useIonRouter();
  
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      router.push("/home");
    }, 500);
  
    return () => {
      clearTimeout(timeoutId); // Clear the timeout when the component unmounts
    };
  }, []);

  return(
    <section className="Loader">
      <div className="Loader_msg">Reticulating splines...</div>
      <div className="Loader_img">
        {Icons.Animation()}
      </div>
    </section>
  )
}
