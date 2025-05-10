from flask import Blueprint, jsonify, request
from flu_finder_src.utils import db_methods as data
from flu_finder_src.utils import queries
from flu_finder_src.utils import data_visualizer as dv
from flu_finder_src.utils.map_visualizer import generate_choropleth
import pandas as pd
import json
import numpy as np

# Create a Blueprint for API routes
api_bp = Blueprint('api', __name__, url_prefix='/api')

class NumpyJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        return super().default(obj)

# Endpoint for fetching data from the CDC
@api_bp.route('/cdc/data', methods=['GET'])
def fetch_data():
    try:
        print("Fetching CDC data...")
        df = data.get_db()
        print("DataFrame columns:", df.columns.tolist())
        print("DataFrame shape:", df.shape)
        
        # Basic data validation
        required_columns = ['Outbreak Date', 'County', 'State', 'Flock Size', 'Flock Type']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise ValueError(f"Missing required columns: {missing_columns}")
            
        df['Outbreak Date'] = pd.to_datetime(df['Outbreak Date'], errors='coerce')
        
        # Convert DataFrame to records format with explicit error handling
        records = {}
        try:
            records['Outbreak Date'] = (df['Outbreak Date'].dt.strftime('%m/%d/%Y').fillna('').tolist())
            records['County'] = df['County'].fillna('Unknown').tolist()
            records['State'] = df['State'].fillna('Unknown').tolist()
            records['Flock Size'] = df['Flock Size'].fillna(0).astype(int).tolist()
            records['Flock Type'] = df['Flock Type'].fillna('Unknown').tolist()
        except Exception as e:
            print(f"Error converting dates: {str(e)}")
            records['Outbreak Date'] = df['Outbreak Date'].astype(str).tolist()
        
        print(f"Successfully prepared records with {len(records['State'])} entries")
        return jsonify(records)
    except Exception as e:
        print(f"Error in fetch_data: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# Enpoint for data by country
@api_bp.route('/country/data', methods=['GET'])
def country_data():
    try:
        summary = queries.get_national_summary()

        return jsonify({
            'status': 'success',
            'summary': summary
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Enpoint for data by state
@api_bp.route('/state/<state>/data', methods=['GET'])
def state_data(state):
    if not state:
        return jsonify({'error': 'Valid State parameter is required'}), 400

    try:
        state = state.title()
        filtered_data = queries.filter_by_state(state)
        summary = queries.get_state_summary(state)
        result = filtered_data.to_dict()

        return jsonify({
            'status': 'success',
            'state': state,
            'summary': summary,
            'data': result
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Enpoint for data by county
@api_bp.route('/county/<state>/<county>/data', methods=['GET'])
def county_data(state, county):
    if not county or not state:
        return jsonify({'error': 'Valid County and State parameters are required'}), 400

    try:
        county = county.title()
        state = state.title()
        filtered_data = queries.filter_by_county(county, state)
        summary = queries.get_county_summary(county, state)
        result = filtered_data.to_dict()

        return jsonify({
            'status': 'success',
            'county': county,
            'state': state,
            'summary': summary,
            'data': result
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Endpoint for initializing the map
@api_bp.route('/map/initialize', methods=['GET'])
def initialize_map_endpoint():
    try:
        # Get the outbreak data
        df = data.get_db()
        # print("Successfully fetched database")

        # Create time frame if argument is passed
        # I think this fails because map only initializes once
        # start = request.args.get('start', None)
        # end = request.args.get('end', None)
        # if start or end:
        #     df = queries.get_time_frame_from_df(df.copy(), start=start, end=end)

        # Count outbreaks per county
        county_outbreaks = df.groupby(['State', 'County']).size().reset_index(name='outbreak_count')
        print("Successfully counted outbreaks per county")

        # Read the GeoJSON file
        geojson_path = "flu_finder_src/data/geojson-counties-fips.json"
        print(f"Attempting to read GeoJSON from: {geojson_path}")

        try:
            with open(geojson_path, "r") as f:
                counties_geojson = json.load(f)
            print("Successfully loaded GeoJSON file")
        except FileNotFoundError:
            print(f"GeoJSON file not found at {geojson_path}")
            return jsonify({'error': 'GeoJSON file not found'}), 500
        except json.JSONDecodeError as e:
            print(f"Error decoding GeoJSON: {str(e)}")
            return jsonify({'error': 'Invalid GeoJSON format'}), 500

        # Add outbreak counts to GeoJSON properties
        feature_count = 0
        for feature in counties_geojson['features']:
            county_name = feature['properties'].get('NAME')
            state_name = feature['properties'].get('STATE')

            if not county_name or not state_name:
                continue

            # Find matching outbreak count
            match = county_outbreaks[
                (county_outbreaks['County'].str.strip() == county_name.strip()) &
                (county_outbreaks['State'].str.strip() == state_name.strip())
            ]

            # Add outbreak count to properties
            feature['properties']['outbreak_count'] = int(match['outbreak_count'].iloc[0]) if not match.empty else 0

            # Add total flock size if available
            if not match.empty:
                county_flock_size = df[
                    (df['County'].str.strip() == county_name.strip()) &
                    (df['State'].str.strip() == state_name.strip())
                ]['Flock Size'].sum()
                feature['properties']['flock_size'] = int(county_flock_size)
            else:
                feature['properties']['flock_size'] = 0

            feature_count += 1

        print(f"Processed {feature_count} features")
        return jsonify(counties_geojson)

    except Exception as e:
        import traceback
        print(f"Error in initialize_map_endpoint: {str(e)}")
        print("Traceback:")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

# Endpoint for map data in GeoJSON format
@api_bp.route('/map/data', methods=['GET'])
def map_data():
    try:
        df = data.get_db()
        # print("DataFrame columns:", df.columns.tolist())  # Debug print

        # Convert DataFrame to GeoJSON format
        features = []
        for _, row in df.iterrows():
            try:
                # Skip entries without valid coordinates
                if 'Longitude' not in row or 'Latitude' not in row:
                    continue

                # Ensure coordinates are valid numbers
                longitude = pd.to_numeric(row.get('Longitude', 0))
                latitude = pd.to_numeric(row.get('Latitude', 0))

                if pd.isna(longitude) or pd.isna(latitude):
                    continue

                feature = {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [longitude, latitude]
                    },
                    "properties": {
                        "state": str(row.get('State', '')),
                        "county": str(row.get('County', '')),
                        "flockSize": int(row.get('Flock Size', 0)),
                        "flockType": str(row.get('Flock Type', '')),
                        "outbreakDate": str(row.get('Outbreak Date', ''))
                    }
                }
                features.append(feature)
            except Exception as row_error:
                print(f"Error processing row: {row_error}")
                continue

        geojson = {
            "type": "FeatureCollection",
            "features": features
        }

        return jsonify(geojson)
    except Exception as e:
        print(f"Error in map_data: {str(e)}")  # Debug print
        return jsonify({'error': str(e)}), 500
    
# Endpoint for interactive Plotly choropleth map
@api_bp.route('/map/choropleth', methods=['GET'])
def get_choropleth_map():
    try:
        selected_state = request.args.get('state')
        selected_county = request.args.get('county')
        
        print(f"[DEBUG] Starting choropleth generation for state: {selected_state}, county: {selected_county}")
        
        try:
            result = generate_choropleth(return_fig=True, selected_state=selected_state, selected_county=selected_county)
            print("[DEBUG] Successfully generated choropleth")
        except Exception as e:
            print(f"[DEBUG] Error in generate_choropleth: {str(e)}")
            import traceback
            print("[DEBUG] Traceback:")
            print(traceback.format_exc())
            raise
        
        print("[DEBUG] Result type:", type(result))
        if isinstance(result, dict) and 'figure' in result:
            print("[DEBUG] Processing new format with bounds")
            try:
                # Check if data is already in dictionary format
                figure_dict = {
                    'data': [trace if isinstance(trace, dict) else trace.to_plotly_json() 
                            for trace in result['figure']['data']],
                    'layout': (result['figure']['layout'] if isinstance(result['figure']['layout'], dict) 
                              else result['figure']['layout'].to_plotly_json()),
                    'bounds': result.get('bounds')
                }
                print("[DEBUG] Successfully created figure_dict")
            except Exception as e:
                print(f"[DEBUG] Error creating figure_dict: {str(e)}")
                import traceback
                print("[DEBUG] Traceback:")
                print(traceback.format_exc())
                raise
        else:
            print("[DEBUG] Processing old format")
            try:
                figure_dict = {
                    'data': [trace if isinstance(trace, dict) else trace.to_plotly_json() 
                            for trace in result.data],
                    'layout': result.layout.to_plotly_json() if hasattr(result.layout, 'to_plotly_json') 
                             else result.layout
                }
                print("[DEBUG] Successfully created figure_dict from old format")
            except Exception as e:
                print(f"[DEBUG] Error creating figure_dict from old format: {str(e)}")
                import traceback
                print("[DEBUG] Traceback:")
                print(traceback.format_exc())
                raise
        
        try:
            json_str = json.dumps(figure_dict, cls=NumpyJSONEncoder)
            print(f"[DEBUG] Successfully serialized JSON (length: {len(json_str)})")
            return json_str, {'Content-Type': 'application/json'}
        except Exception as e:
            print(f"[DEBUG] Error serializing to JSON: {str(e)}")
            import traceback
            print("[DEBUG] Traceback:")
            print(traceback.format_exc())
            raise
            
    except Exception as e:
        import traceback
        print(f"[DEBUG] Error in get_choropleth_map: {str(e)}")
        print("[DEBUG] Traceback:")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

# Endpoint for interactive Plotly charts
@api_bp.route('/chart', methods=['GET'])
def create_graph():
    # Get data
    df = data.get_db()
    
    # Mapping chart types to functions
    chart_options = {
        'hbar_sizes': dv.get_horizontal_comparison_flock_sizes,
        'hbar_freqs': dv.get_horizontal_comparison_frequencies,
        'hbar_types': dv.get_horizontal_comparison_flock_types,
        'pie_sizes': dv.get_pie_flock_sizes,
        'pie_freqs': dv.get_pie_frequencies,
        'pie_types': dv.get_pie_flock_types,
        'vbar': dv.get_vertical_outbreaks_over_time,
    }

    chart_type = request.args.get("type", default="vbar")
    chart_func = chart_options.get(chart_type)

    if not chart_func:
        return {"error": "Invalid chart type"}, 400

    # Get all other query parameters except 'type'
    params = {key: value for key, value in request.args.items() if key != "type"}
    
    # Set the config based on the chart_type name
    if "pie" in chart_type:
        config = {"displaylogo": False}
    else:
        config = {"scrollZoom": True,
                "modeBarButtonsToRemove": ["autoScale", "select2d", "lasso2d"],
                'toImageButtonOptions': {
                'filename': 'flufinder_chart',
                },
                "displaylogo": False,
        }
    try:
        # result = json.loads(chart_func(df, config=config, **params).to_json())
        fig = chart_func(df, **params)
        result = {"figure": json.loads(fig.to_json()), "config": config}
    except AttributeError:
        result = "Invalid data. Check time range and try again."
    return result
# Example use for this route
# To create a pie chart showing a comparison of top 3 flock sizes by county in New York State, with a date range from 2023 - 2024:
# /api/chart?type=pie_sizes&state=New%20York&show_top_n=3&start=2023&end=2024
# Parameters: 
# type - Chart name. See above, in the "chart_options" dictionary. Defaults to "outbreaks over time" vertical bar graph
# state - Specify state to compare counties within the state. Excluding it will compare states in USA
# show_top_n - Shows top n values (ex: top 3)
# start - Start of time range. Can be used by itself to show data from custom start to present day
# end - End of time range. Can be used by itself to show data from first outbreak to custom end