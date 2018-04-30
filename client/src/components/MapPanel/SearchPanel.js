import React from 'react'
import { Dropdown } from 'semantic-ui-react'

const SearchPanel = ({
  origin,
  destination,
  handleSearch,
  handleSearchPanelChange,
}) => {
  return (
    <div>
      <Dropdown
        className="truncate"
        placeholder="Origin"
        fluid
        selection
        search={options => options}
        value={origin.place_id}
        options={origin.options}
        style={{ borderRadius: 0, border: 0, borderLeft: '10px solid #2185d0' }}
        onSearchChange={(event, data) =>
          handleSearch('origin', data.searchQuery)
        }
        onChange={(event, data) =>
          handleSearchPanelChange('origin', data.value)
        }
        noResultsMessage={origin.loadingOptions ? 'Loading...' : 'No results'}
        loading={origin.loadingOptions}
      />
      <Dropdown
        className="truncate"
        placeholder="Destination"
        fluid
        selection
        search={options => options}
        value={destination.place_id}
        options={destination.options}
        style={{ borderRadius: 0, border: 0, borderLeft: '10px solid #db2828' }}
        onSearchChange={(event, data) =>
          handleSearch('destination', data.searchQuery)
        }
        onChange={(event, data) =>
          handleSearchPanelChange('destination', data.value)
        }
        noResultsMessage={
          destination.loadingOptions ? 'Loading...' : 'No results'
        }
        loading={destination.loadingOptions}
      />
    </div>
  )
}

export default SearchPanel
