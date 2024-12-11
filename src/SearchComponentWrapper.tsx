import React, { useEffect, useRef } from 'react';
import { SearchComponent } from 'obsidian';

interface SearchComponentWrapperProps {
    onSearch: (query: string) => void;
    placeholder?: string;
}

const SearchComponentWrapper: React.FC<SearchComponentWrapperProps> = ({ onSearch, placeholder }: SearchComponentWrapperProps) => {
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (searchRef.current) {
            const searchComponent = new SearchComponent(searchRef.current);

            searchComponent.setPlaceholder(placeholder || 'Search...');
            searchComponent.onChange(onSearch);
            return () => {
                searchRef.current?.empty();
            };
        }
    }, [onSearch, placeholder]);

    return <div ref={searchRef} />;
};

export default SearchComponentWrapper; 