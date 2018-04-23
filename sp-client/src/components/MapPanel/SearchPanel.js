import React from 'react'
import { Dropdown } from 'semantic-ui-react'

const SearchPanel = ({
  origin,
  destination,
  handleSearch,
  handleSearchPanelChange,
}) => {
  return (
    <div style={{ position: 'absolute', top: 49, width: '100%' }}>
      <Dropdown
        className="truncate"
        placeholder="Origin"
        fluid
        selection
        search
        value={origin.name}
        options={origin.options}
        style={{ borderRadius: 0, border: 0 }}
        onSearchChange={(event, data) =>
          handleSearch('origin', data.searchQuery)
        }
        onChange={(event, data) =>
          handleSearchPanelChange('origin', data.value)
        }
        loading={origin.loadingOptions}
      />
      <Dropdown
        className="truncate"
        placeholder="Destination"
        fluid
        selection
        search
        value={destination.name}
        options={destination.options}
        style={{ borderRadius: 0, border: 0 }}
        onSearchChange={(event, data) =>
          handleSearch('destination', data.searchQuery)
        }
        onChange={(event, data) =>
          handleSearchPanelChange('destination', data.value)
        }
        loading={destination.loadingOptions}
      />
    </div>
  )
}

export default SearchPanel
