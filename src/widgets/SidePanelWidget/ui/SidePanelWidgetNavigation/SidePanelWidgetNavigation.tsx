import { NavLink } from "react-router-dom";
import type { SidePanelWidgetNavItemsProps } from "../model/types";


export const SidePanelWidgetNavItems = ({ items }: SidePanelWidgetNavItemsProps) => {
    if (items.length === 0) {
        return <div>Lists are empty</div>;
    }
    
    return (
        <ul>
        {items.map((item) => (
          <NavLink to={item.path} key={item.id}>
            {item.label}
            <br />
          </NavLink>
        ))}
      </ul>
    );
};