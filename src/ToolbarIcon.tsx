import React, { useState, useCallback, useRef, useEffect } from 'react';

interface MenuItem {
    title: string;
    onClick: (checked: boolean) => void;
    checked: boolean;
}

interface ToolbarIconProps {
    icon: React.ReactNode;
    tooltip: string;
    onClick?: () => void;
    menu?: MenuItem[];
    isSelected?: boolean;
    className?: string;
}

const ToolbarIcon: React.FC<ToolbarIconProps> = ({
    icon,
    tooltip,
    onClick,
    menu,
    isSelected = false,
    className = ''
}: ToolbarIconProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const iconRef = useRef<HTMLDivElement>(null);

    const isAnyMenuItemSelected = useCallback(() => {
        return menu ? menu.some(item => item.checked) : false;
    }, [menu]);

    const handleClick = (event: React.MouseEvent) => {
        if (menu) {
            setIsMenuOpen(!isMenuOpen);
        } else if (onClick) {
            onClick();
        }
    };

    const handleMenuItemClick = useCallback((index: number) => {
        if (menu) {
            const item = menu[index];
            item.onClick(!item.checked);
        }
    }, [menu]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isMenuOpen &&
                menuRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                iconRef.current &&
                !iconRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    return (
        <div className="toolbar-icon-container relative">
            <div
                ref={iconRef}
                className={`
                    clickable-icon
                    flex items-center justify-center w-8 h-8
                    text-sm text-muted-foreground hover:text-foreground
                    ${isSelected || isAnyMenuItemSelected() ? 'is-active' : ''}
                    ${className}
                `}
                aria-label={tooltip}
                onClick={handleClick}
                title={tooltip}
            >
                {icon}
            </div>
            {menu && isMenuOpen && (
                <div
                    ref={menuRef}
                    className="toolbar-dropdown absolute top-full left-0 mt-1 py-2 rounded-md shadow-md z-50 min-w-[200px]"
                >
                    {menu.map((item, index) => (
                        <label
                            key={index}
                            className="toolbar-dropdown-item flex items-center px-4 py-2 cursor-pointer hover:bg-hover transition-colors duration-150"
                        >
                            <input
                                type="checkbox"
                                checked={item.checked}
                                onChange={() => handleMenuItemClick(index)}
                                className="mr-3 toolbar-checkbox"
                            />
                            <span className="text-sm toolbar-dropdown-text">{item.title}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ToolbarIcon; 