import React, { useState } from 'react';
function sol({ menuConfig }) {
    const [menuOpened, setMenuOpened] = useState;
    const menu = menuConfig.map((menu, index) => (
        <div
            data-test-id={`first-level-${menu.title.toLowerCase()}`}
            key={menu.title}
        >
            {menu.title}
            {menu.subItems && menu.subItems.length > 0 && (
                <button
                    data-test-id={`button-${menu.title.toLowerCase()}`}
                    onClick={() => {
                        setMenuOpened(currValue => (currValue === index ? -1 : index))
                    }}
                >
                    {menuOpened === index ? 'Hide' : 'Expand'}
                </button>
            )}
            {menu.subItems && menu.subItems.length > 0 && menuOpened === index && (
                <ul data-test-id={`ul-${menu.title.toLowerCase()}`}>
                    {menu.subItems.map(item => (
                        <li
                            data-test-id={`li-${menu.title.toLowerCase()}-${item.toLowerCase()}`}
                            key={`li-${menu.title.toLowerCase()}-${item.toLowerCase()}`}
                        >
                            {item}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    ))
    return <div className='menu-wrapper'>{menu}</div>
}
export default sol;