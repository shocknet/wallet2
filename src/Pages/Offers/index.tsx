import * as Icons from "../../Assets/SvgIconLibrary";

export const Offers = () => {
  return (
    <div className="Offers_container">
      <div className="Offers">
        <div className="Offers_header_text">Static Payment Offers</div>
        <div className="Offers_item">
          <div className="item_title">
            <img src="/SN_avatar.svg" alt="logo" />
            Bootstrap Node
          </div>
          <div className="RightIcon">{Icons.ChevronRightIcon()}</div>
        </div>
        <div className="Offers_source">
          <div className="source_header">
            <div className="title">Default Offers</div>
            {Icons.pencilIcons()}
          </div>
          <div className="source_data">
            noffer1qqz23w4d34r23ey333e3qsddrd2d3xwd45...
          </div>
          <div className="source_footer">
            <div className="title">Spontaneous Payments</div>
            {Icons.combindIcon()}
          </div>
        </div>
      </div>
    </div>
  );
};
