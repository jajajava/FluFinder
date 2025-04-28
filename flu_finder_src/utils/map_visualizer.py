import plotly.express as px
import json
import os
from flu_finder_src.utils.queries import get_grouped_outbreaks_with_fips
import pandas as pd

def generate_choropleth(return_fig=False, selected_state=None, selected_county=None):
    try:
        # Get grouped and cleaned outbreak data (with FIPS)
        grouped = get_grouped_outbreaks_with_fips()
        
        # Get the global max value for consistent color scaling
        global_max = grouped["Flock Size"].max()

        # Load GeoJSON
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        geojson_path = os.path.join(base_dir, "data", "geojson-counties-fips.json")
        with open(geojson_path) as f:
            counties_geojson = json.load(f)

        # Get state boundaries for zooming
        states_path = os.path.join(base_dir, "data", "states.json")
        with open(states_path) as f:
            states_geojson = json.load(f)

        # Filter data if state/county selected
        display_data = grouped.copy()
        if selected_state:
            display_data = display_data[display_data["State"].str.title() == selected_state.title()]
            if selected_county:
                display_data = display_data[display_data["County"].str.title() == selected_county.title()]

        # Calculate center point for selected state
        center_point = None
        if selected_state:
            # Find state boundaries
            for feature in states_geojson['features']:
                if feature['properties']['NAME'].upper() == selected_state.upper():
                    coords = feature['geometry']['coordinates']
                    # Handle multi-polygon states (like Hawaii)
                    all_coords = []
                    if feature['geometry']['type'] == 'MultiPolygon':
                        for poly in coords:
                            all_coords.extend(poly[0])
                    else:
                        all_coords = coords[0]
                    
                    # Calculate center point
                    lons = [coord[0] for coord in all_coords]
                    lats = [coord[1] for coord in all_coords]
                    center_point = {
                        'lon': sum(lons) / len(lons),
                        'lat': sum(lats) / len(lats)
                    }
                    break

        # Create figure with filtered data but global scale
        fig = px.choropleth(
            display_data,
            geojson=counties_geojson,
            locations='FIPS',
            featureidkey="id",
            color='Flock Size',
            color_continuous_scale=[
                [0, "#ffffff"],      # White for 0
                [0.001, "#4a90c2"],  # Start blue for any non-zero value
                [0.2, "#5a9bd4"],
                [0.4, "#3a7bbf"],
                [0.6, "#2b6ca3"],
                [0.8, "#1f4e79"],
                [1.0, "#0b2e59"]     # Very dark navy blue
            ],
            range_color=[0, global_max],  # Force global scale starting at 0
            scope="usa",
            labels={'Flock Size': 'Flock Size'},
            hover_data={
                "County": True,
                "State": True,
                "Flock Size": True,
                "FIPS": False   # ← hide FIPS
            },
        )

        # Force non-negative scale
        fig.update_traces(
            zmin=0,
            selector=dict(type='choropleth')
        )

        # Special handling for Louisiana parishes and Alaska boroughs
        if selected_state and selected_county:
            is_louisiana = selected_state.upper() == 'LOUISIANA'
            is_alaska = selected_state.upper() == 'ALASKA'
            
            if is_louisiana or is_alaska:
                # Find the selected county/parish in the GeoJSON data
                selected_feature = None
                for feature in counties_geojson['features']:
                    county_name = feature['properties'].get('NAME', '')
                    state_name = feature['properties'].get('STATE', '')
                    
                    # Handle special cases for parish/borough names
                    if is_louisiana:
                        county_name = county_name.replace(' Parish', '')
                    elif is_alaska:
                        county_name = county_name.replace(' Borough', '').replace(' Census Area', '')
                    
                    if is_louisiana and county_name.upper() == selected_county.upper() and state_name == 'LA':
                        selected_feature = feature
                    elif is_alaska and county_name.upper() == selected_county.upper() and state_name == 'AK':
                        selected_feature = feature
                        break
                
                if selected_feature:
                    # Add a trace specifically for the selected county/parish
                    fig.add_trace(
                        dict(
                            type="choropleth",
                            geojson={"type": "FeatureCollection", "features": [selected_feature]},
                            locations=[selected_feature['properties']['NAME']],
                            z=[1],  # Use 1 to make it visible
                            showscale=False,
                            hoverinfo='skip',
                            marker=dict(
                                line=dict(color='#ffffff', width=2),
                                color='rgba(255, 255, 255, 0.1)'  # Slight highlight
                            ),
                            showlegend=False
                        )
                    )

        # Add state boundaries with highlight for selected state
        if selected_state:
            for feature in states_geojson['features']:
                if feature['properties']['NAME'].upper() == selected_state.upper():
                    # Add state boundary trace with thicker line for selected state
                    fig.add_trace(
                        dict(
                            type="choropleth",
                            geojson={"type": "FeatureCollection", "features": [feature]},
                            locations=[feature['properties']['NAME']],
                            z=[0],  # Use 0 to not affect scale
                            zmin=0,  # Force non-negative
                            zmax=global_max,  # Match global scale
                            showscale=False,
                            hoverinfo='skip',
                            marker=dict(
                                line=dict(color='#ffffff', width=2),
                                opacity=0  # Make the fill completely transparent
                            ),
                            showlegend=False
                        )
                    )

        # Set layout and title
        layout_update = {
            'margin': {"r": 0, "t": 0, "l": 0, "b": 0},
            'paper_bgcolor': "#1e1e1e",
            'plot_bgcolor': "#1e1e1e",
            'geo': {
                'bgcolor': "#1e1e1e",
                'lakecolor': "#1e1e1e",
                'landcolor': "#2d2d2d",
                'subunitcolor': "#666666",
                'showlakes': True,
                'showland': True,
                'showsubunits': True,
                'showcountries': True,
                'countrycolor': "#666666",
                'coastlinecolor': "#666666",
                'scope': 'usa',
                'showframe': False,  # Remove the frame
                'projection': {
                    'scale': 1.0,
                    'type': 'albers usa'
                },
                'domain': {
                    'x': [0, 1],  # Use full width 
                    'y': [0, 1]   # Use full height
                }
            },
            'coloraxis': {
                'cmin': 0,
                'cmax': global_max,
                'cmid': global_max/2,
                'colorbar': dict(
                    title=dict(
                        text="Flock Size",
                        font=dict(color="#ffffff")
                    ),
                    tickmode='array',
                    tickvals=[0, 2_018_000, 4_036_000, 6_054_000, 8_072_000, 10_090_000, 12_108_000],
                    ticktext=[
                        "0",
                        "2,018,000",
                        "4,036,000", 
                        "6,054,000",
                        "8,072,000",
                        "10,090,000",
                        "12,108,000"
                    ],
                    tickfont=dict(color="#ffffff"),
                    len=0.9,
                    thickness=15,
                    x=-0.07,  # Move closer to edge
                    y=0.5,
                    yanchor='middle'
                )
            },
            'autosize': True,
            'width': 1200,  # Set a wider width to ensure full horizontal expansion
            'height': 600   # Maintain aspect ratio
        }

        # Add zoom settings if state is selected
        if center_point:
            state_feature = next((f for f in states_geojson['features'] 
                               if f['properties']['NAME'].upper() == selected_state.upper()), None)
            if state_feature:
                coords = state_feature['geometry']['coordinates']
                all_coords = []
                if state_feature['geometry']['type'] == 'MultiPolygon':
                    for poly in coords:
                        all_coords.extend(poly[0])
                else:
                    all_coords = coords[0]
                
                lons = [coord[0] for coord in all_coords]
                lats = [coord[1] for coord in all_coords]
                
                # Calculate state size
                lon_range = max(lons) - min(lons)
                lat_range = max(lats) - min(lats)
                state_size = max(lon_range, lat_range)
                
                # Special handling for Alaska and Louisiana
                is_alaska = selected_state.upper() == 'ALASKA'
                is_louisiana = selected_state.upper() == 'LOUISIANA'
                
                # Calculate padding for view that includes entire state plus surrounding area
                padding_factor = 0.2  # Default padding
                
                if is_alaska:
                    padding_factor = 0.3  # More padding for Alaska
                    projection_scale = 0.8  # Smaller scale for Alaska
                elif is_louisiana:
                    padding_factor = 0.15  # Less padding for Louisiana
                    projection_scale = 1.2  # Larger scale for Louisiana
                else:
                    # For wider states, use less padding to ensure full width utilization
                    if lon_range > lat_range * 1.5:  # Wide state
                        padding_factor = 0.1
                    projection_scale = 1.0
                
                lon_padding = lon_range * padding_factor
                lat_padding = lat_range * padding_factor
                
                # Update layout with calculated bounds
                layout_update['geo'].update({
                    'center': {'lon': center_point['lon'], 'lat': center_point['lat']},
                    'projection': {
                        'scale': projection_scale,
                        'type': 'albers usa'
                    },
                    'lonaxis': {
                        'range': [min(lons) - lon_padding, max(lons) + lon_padding],
                        'showgrid': False
                    },
                    'lataxis': {
                        'range': [min(lats) - lat_padding, max(lats) + lat_padding],
                        'showgrid': False
                    }
                })

        fig.update_layout(**layout_update)

        # Outline each county
        fig.update_traces(marker_line_width=0.5, marker_line_color="#666666", selector=dict(type='choropleth'))

        # Return figure or save HTML
        if return_fig:
            if selected_state and state_feature:
                # Include bounds information in the return value
                return {
                    'figure': fig,
                    'bounds': {
                        'bounds': {
                            'min_lon': min(lons) - lon_padding,
                            'max_lon': max(lons) + lon_padding,
                            'min_lat': min(lats) - lat_padding,
                            'max_lat': max(lats) + lat_padding
                        },
                        'center': center_point
                    }
                }
            return {
                'figure': fig
            }

        output_path = os.path.join(base_dir, "static", "choropleth_map.html")
        fig.write_html(output_path)
        print(f"✅ Map saved to {output_path}")

    except Exception as e:
        print(f"Error in generate_choropleth: {str(e)}")
        raise

if __name__ == "__main__":
    print("👋 map_visualizer.py is being run directly")
    generate_choropleth()