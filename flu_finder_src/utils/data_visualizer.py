import pandas as pd
import plotly.express as px
try: # Render requires a relative path, GitHub Actions requires an absolute path
    from .db_methods import *
    from .queries import *
except ImportError:
    from db_methods import *
    from queries import *
import sys

df = get_db()

# Horizontal bar graph comparing sizes of outbreaks; how many birds are affected (scope: national or state)
def get_horizontal_comparison_flock_sizes(df, show_top_n=None, selected_state=None, start=None, end=None, **kwargs):
    # Step 1: Grab title and output file (if manually set)
    title = kwargs.get("title", None)
    # Replaced "None" with simpler title
    output_file = kwargs.get("output_file", "bar_compare_flock_sizes.html")

    # Check if data frame is good. If not, likely a programmer error
    if df.empty:
        return "No data to visualize. Check your input data and try again"

    # Select time range
    if (start != None) and (end == None):
        df = get_time_frame_from_df(df, start, "3000")
    elif (start == None) and (end != None):
        df = get_time_frame_from_df(df, "2020", end)
    elif (start != None) and (end != None):
        df = get_time_frame_from_df(df, start, end)
    else:
        df = df.copy()
        
    # Check if the time range returns no data. If not, likely a user error
    if df.empty:
        return "No data to visualize. Check your time range and try again"

    if not selected_state:
        # National level: group by state
        group_col = "State"
        group_col_plural = "States"
        scope_name = "USA"
    else:
        # State level: group by county
        group_col = "County"
        group_col_plural = "Counties"
        scope_name = selected_state.title()
        df = df[df["State"].str.title() == scope_name]

    # Group and calculate percentage
    grouped = df.groupby(group_col, as_index=False)["Flock Size"].sum()
    grouped["Percentage"] = (grouped["Flock Size"] / grouped["Flock Size"].sum() * 100).round(3)

    # Sort from highest to lowest and reverse y-axis later for top-to-bottom effect
    grouped = grouped.sort_values(by="Flock Size", ascending=False)
    if show_top_n is not None:
        grouped = grouped.head(int(show_top_n))
    
    if not title:
        title = build_title(
            prefix="Affected Flock Size",
            group_col=group_col,
            group_col_plural=group_col_plural,
            scope_name=scope_name,
            show_top_n=show_top_n,
            start=start,
            end=end
        )

    fig = px.bar(
        grouped,
        x="Percentage",
        y=group_col,
        orientation='h',
        title=title,
        text="Percentage",
        color="Percentage",
        color_continuous_scale="Blugrn",  # Add '_r' to reverse
        custom_data=["Flock Size"]
    )

    fig.update_layout(
        xaxis_title="Percentage",
        yaxis_title=group_col,
        title_x=0.5,
        template="plotly_white",
        height=max(400, 30 * len(grouped)),  # Dynamic height based on # of bars
        yaxis=dict(
            autorange="reversed",
            tickfont=dict(size=9),
        ),
        coloraxis_colorbar=dict(
            thickness=10,
            x=1.05,
            xanchor="left",
            tickfont=dict(size=10)
        ),
        dragmode='pan'
    )
    # Splits the title if there is a (, which only happens when there's a time range
    if (title.find("(") > 0):
        index = title.find("(")
        title = title[:index] + '<br>' + title[index :]
        fig.update_layout(
            title = dict(
                text = title,
                x = 0.50001,
                y = 0.95,
                font = dict(
                    size = 11
                    )
                )
            )

    fig.update_traces(
        texttemplate='%{text:.2f}%',
        textposition='outside',
        hovertemplate=(
            # f"{group_col}: %{{y}}<br>" +
            "Birds: %{customdata[0]:,}<br>" +
            "Percentage: %{x:.2f}%<extra></extra>"
        )
    )

    # Step 3: Auto-generate output file name if none was provided
    # Note: I replaced "None" with "horizontal_comparison_output.html"
    #   I think it would be better to be consistent with the file name since it'll only be used in frontend integration
    # if output_file is None:
    #     safe_scope = scope_name.lower().replace(" ", "_")
    #     safe_group = group_col.lower()
    #     top_tag = f"top{show_top_n}_" if show_top_n is not None else ""
    #     output_file = f"{top_tag}{safe_group}s_comparison_{safe_scope}.html"

    # Save to HTML
    # fig.write_html(output_file, config=config)
    # print(f"Comparison chart saved to {output_file}")
    
    return fig

# Horizontal bar graph comparing outbreak locations; how frequently outbreaks occur in one area (scope: national or state)
def get_horizontal_comparison_frequencies(df, show_top_n=None, selected_state=None, start=None, end=None, **kwargs):
    title = kwargs.get("title", None)
    output_file = kwargs.get("output_file", "bar_compare_frequencies.html")

    # Check if data frame is good. If not, likely a programmer error
    if df.empty:
        return "No data to visualize. Check your input data and try again"

    # Select time range
    if (start != None) and (end == None):
        df = get_time_frame_from_df(df, start, "3000")
    elif (start == None) and (end != None):
        df = get_time_frame_from_df(df, "2020", end)
    elif (start != None) and (end != None):
        df = get_time_frame_from_df(df, start, end)
    else:
        df = df.copy()
        
    # Check if the time range returns no data. If not, likely a user error
    if df.empty:
        return "No data to visualize. Check your time range and try again"

    if not selected_state:
        # National level: group by state
        group_col = "State"
        group_col_plural = "States"
        scope_name = "USA"
    else:
        # State level: group by county
        group_col = "County"
        group_col_plural = "Counties"
        scope_name = selected_state.title()
        df = df[df["State"].str.title() == scope_name]

    # Group and calculate frequency
    grouped = df[group_col].value_counts().reset_index()
    grouped.columns = [group_col, "Outbreak Count"]
    grouped["Frequency (%)"] = (grouped["Outbreak Count"] / grouped["Outbreak Count"].sum() * 100).round(3)

    # Sort and optionally limit
    grouped = grouped.sort_values(by="Frequency (%)", ascending=False)
    if show_top_n is not None:
        grouped = grouped.head(int(show_top_n))
    
    if not title:
        title = build_title(
            prefix="Outbreak Frequency",
            group_col=group_col,
            group_col_plural=group_col_plural,
            scope_name=scope_name,
            show_top_n=show_top_n,
            start=start,
            end=end
        )

    # Bar plot with custom hover
    fig = px.bar(
        grouped,
        x="Frequency (%)",
        y=group_col,
        orientation='h',
        title=title,
        text="Frequency (%)",
        color="Frequency (%)",
        color_continuous_scale="Blugrn",
        custom_data=["Outbreak Count"]  # Pass raw count to hover
    )

    fig.update_traces(
        texttemplate='%{text:.2f}%',
        textposition='outside',
        hovertemplate=(
            # "State: %{y}<br>" +
            "Outbreaks: %{customdata[0]:,}<br>" +
            "Frequency: %{x:.2f}%<extra></extra>"
        )
    )

    fig.update_layout(
        xaxis_title="Frequency of Outbreaks (%)",
        yaxis_title=group_col,
        title_x=0.5,
        template="plotly_white",
        height=max(400, 30 * len(grouped)),
        yaxis=dict(
            autorange="reversed",
            tickfont=dict(size=9),
        ),
        coloraxis_colorbar=dict(
            thickness=10,
            x=1.05,
            xanchor="left",
            tickfont=dict(size=10)
        ),
        dragmode='pan'
    )
    # Splits the title if there is a (, which only happens when there's a time range
    if (title.find("(") > 0):
        index = title.find("(")
        title = title[:index] + '<br>' + title[index :]
        fig.update_layout(
            title = dict(
                text = title,
                x = 0.50001,
                y = 0.95,
                font = dict(
                    size = 11
                    )
                )
            )


    config = {
        "displayModeBar": True,
        "scrollZoom": True,
        "modeBarButtonsToRemove": ["autoScale", "select2d", "lasso2d"]
    }

    # Save HTML
    # fig.write_html(output_file, config=config)
    # print(f"Comparison chart saved to {output_file}")
    
    return fig

# Horizontal bar graph comparing % of flock types; what type of bird is affected (scope: national or state)
def get_horizontal_comparison_flock_types(df, show_top_n=None, selected_state=None, start=None, end=None, **kwargs):
    # Step 1: Grab title and output file (if manually set)
    title = kwargs.get("title", None)
    output_file = kwargs.get("output_file", "bar_compare_flock_types.html")

    # Check if data frame is good. If not, likely a programmer error
    if df.empty:
        return "No data to visualize. Check your input data and try again"

    # Select time range
    if (start != None) and (end == None):
        df = get_time_frame_from_df(df, start, "3000")
    elif (start == None) and (end != None):
        df = get_time_frame_from_df(df, "2020", end)
    elif (start != None) and (end != None):
        df = get_time_frame_from_df(df, start, end)
    else:
        df = df.copy()
        
    # Check if the time range returns no data. If not, likely a user error
    if df.empty:
        return "No data to visualize. Check your time range and try again"

    if not selected_state:
        # National level: group by state
        group_col = "State"
        group_col_plural = "States"
        scope_name = "USA"
    else:
        # State level: group by county
        group_col = "County"
        group_col_plural = "Counties"
        scope_name = selected_state.title()
        df = df[df["State"].str.title() == scope_name]

    # Group by Flock Type and count
    grouped = df["Flock Type"].value_counts().reset_index()
    grouped.columns = ["Flock Type", "Count"]
    grouped["Percentage"] = (grouped["Count"] / grouped["Count"].sum() * 100).round(3)

    # Sort and slice
    grouped = grouped.sort_values(by="Percentage", ascending=False)
    if show_top_n is not None:
        grouped = grouped.head(int(show_top_n))
    
    if not title:
        title = f"Affected Flock Type - {title_picker(df)}"
        if start or end:
            date_range = f"{start or '02/08/2022'} to {end or 'Present'}"
            title = f"{title} ({date_range})"

    # Plot
    fig = px.bar(
        grouped,
        x="Percentage",
        y="Flock Type",
        orientation='h',
        title=title,
        text="Percentage",
        color="Percentage",
        color_continuous_scale="Blugrn"
    )

    fig.update_layout(
        xaxis_title="Flock Type Percentage",
        yaxis_title="Flock Type",
        title_x=0.5,
        template="plotly_white",
        height=max(400, 30 * len(grouped)),
        yaxis=dict(
            autorange="reversed",
            tickfont=dict(size=5),
        ),
        coloraxis_colorbar=dict(
            thickness=10,
            x=1,
            xanchor="left",
            tickfont=dict(size=10)
        ),
        dragmode='pan'
    )
    # Splits the title if there is a (, which only happens when there's a time range
    if (title.find("(") > 0):
        index = title.find("(")
        title = title[:index] + '<br>' + title[index :]
        fig.update_layout(
            title = dict(
                text = title,
                x = 0.50001,
                y = 0.95,
                font = dict(
                    size = 11
                    )
                )
            )

    fig.update_traces(
        texttemplate='%{text:.2f}%',
        textposition='outside',
        hovertemplate=(
            "Count: %{customdata[0]:,}<br>" +
            "Percentage: %{x:.2f}%"
        ),
        customdata=grouped[["Count"]]
    )

    config = {"displayModeBar": True,
              "scrollZoom": True,
              "modeBarButtonsToRemove": ["autoScale", "select2d", "lasso2d"]}

    # fig.write_html(output_file, config=config)
    # print(f"Comparison chart saved to {output_file}")
    
    return fig

# Pie chart comparing sizes of outbreaks; how many birds are affected (scope: national or state)
def get_pie_flock_sizes(df, show_top_n=None, selected_state=None, start=None, end=None, **kwargs):
    title = kwargs.get("title", None)
    output_file = kwargs.get("output_file", "pie_compare_flock_sizes.html")

    # Check if data frame is good. If not, likely a programmer error
    if df.empty:
        return "No data to visualize. Check your input data and try again"

    # Select time range
    if (start != None) and (end == None):
        df = get_time_frame_from_df(df, start, "3000")
    elif (start == None) and (end != None):
        df = get_time_frame_from_df(df, "2020", end)
    elif (start != None) and (end != None):
        df = get_time_frame_from_df(df, start, end)
    else:
        df = df.copy()
        
    # Check if the time range returns no data. If not, likely a user error
    if df.empty:
        return "No data to visualize. Check your time range and try again"

    if not selected_state:
        # National level: group by state
        group_col = "State"
        group_col_plural = "States"
        scope_name = "USA"
    else:
        # State level: group by county
        group_col = "County"
        group_col_plural = "Counties"
        scope_name = selected_state.title()
        df = df[df["State"].str.title() == scope_name]

    # Group and calculate total and percentage
    grouped = df.groupby(group_col, as_index=False)["Flock Size"].sum()
    grouped["Percentage"] = (grouped["Flock Size"] / grouped["Flock Size"].sum() * 100).round(2)
    grouped = grouped.sort_values(by="Flock Size", ascending=False)
    
    # Slice
    if show_top_n is not None:
        grouped = grouped.head(int(show_top_n))
    
    if not title:
        title = build_title(
            prefix="Affected Flock Size",
            group_col=group_col,
            group_col_plural=group_col_plural,
            scope_name=scope_name,
            show_top_n=show_top_n,
            start=start,
            end=end
        )

    # Create pie chart
    fig = px.pie(
        grouped,
        names=group_col,
        values="Flock Size",
        title=title,
        hover_data=["Percentage"]
    )

    fig.update_traces(
        textinfo="none",
        hovertemplate=f"State: %{{label}}<br>Birds: %{{value:,}}<br>Percentage: %{{customdata[0]}}%",
        customdata=grouped[["Percentage"]]
    )

    fig.update_layout(
        title_x=0.5,
        # width=450,
        # height=450,
        template="plotly_white"
    )
    # Splits the title if there is a (, which only happens when there's a time range
    if (title.find("(") > 0):
        index = title.find("(")
        title = title[:index] + '<br>' + title[index :]
        fig.update_layout(
            title = dict(
                text = title,
                x = 0.50001,
                y = 0.95,
                font = dict(
                    size = 12
                    )
                )
            )

    # fig.write_html(output_file, config=config)
    # print(f"Pie chart saved to {output_file}")
    
    # return fig.show(config=config)
    return fig

# Pie chart comparing % of outbreaks; how often outbreaks occur (scope: national or state)
def get_pie_frequencies(df, show_top_n=None, selected_state=None, start=None, end=None, **kwargs):
    title = kwargs.get("title", None)
    output_file = kwargs.get("output_file", "pie_compare_frequencies.html")

    # Check if data frame is good. If not, likely a programmer error
    if df.empty:
        return "No data to visualize. Check your input data and try again"

    # Select time range
    if (start != None) and (end == None):
        df = get_time_frame_from_df(df, start, "3000")
    elif (start == None) and (end != None):
        df = get_time_frame_from_df(df, "2020", end)
    elif (start != None) and (end != None):
        df = get_time_frame_from_df(df, start, end)
    else:
        df = df.copy()
        
    # Check if the time range returns no data. If not, likely a user error
    if df.empty:
        return "No data to visualize. Check your time range and try again"

    if not selected_state:
        # National level: group by state
        group_col = "State"
        group_col_plural = "States"
        scope_name = "USA"
    else:
        # State level: group by county
        group_col = "County"
        group_col_plural = "Counties"
        scope_name = selected_state.title()
        df = df[df["State"].str.title() == scope_name]

    # Group and calculate frequency
    grouped = df[group_col].value_counts().reset_index()
    grouped.columns = [group_col, "Outbreak Count"]
    grouped["Frequency (%)"] = (grouped["Outbreak Count"] / grouped["Outbreak Count"].sum() * 100).round(3)

    # Sort for consistent display
    grouped = grouped.sort_values(by="Frequency (%)", ascending=False)
    
    # Slice
    if show_top_n is not None:
        grouped = grouped.head(int(show_top_n))
    
    if not title:
        title = build_title(
            prefix="Outbreak Frequency",
            group_col=group_col,
            group_col_plural=group_col_plural,
            scope_name=scope_name,
            show_top_n=show_top_n,
            start=start,
            end=end
        )

    # Create pie chart
    fig = px.pie(
        grouped,
        names=group_col,
        values="Outbreak Count",
        title=title,
        custom_data=["Frequency (%)"]
    )

    fig.update_traces(
        textinfo="none",  # Hide slice labels
        hovertemplate=(
            "%{label}<br>" +
            "Outbreaks: %{value:,}<br>" +
            "Frequency: %{customdata[0]:.2f}%<extra></extra>"
        )
    )

    fig.update_layout(
        title_x=0.5,
        # width=450,
        # height=450,
        template="plotly_white"
    )
    # Splits the title if there is a (, which only happens when there's a time range
    if (title.find("(") > 0):
        index = title.find("(")
        title = title[:index] + '<br>' + title[index :]
        fig.update_layout(
            title = dict(
                text = title,
                x = 0.50001,
                y = 0.95,
                font = dict(
                    size = 12
                    )
                )
            )

    # fig.write_html(output_file, config=config)
    # print(f"Plot saved to {output_file}")
    return fig

# Pie chart comparing % of flock types; what type of bird is affected (scope: national or state)
def get_pie_flock_types(df, show_top_n=None, selected_state=None, start=None, end=None, **kwargs):
    title = kwargs.get("title", None)
    output_file = kwargs.get("output_file", "pie_compare_flock_types.html")

    # Check if data frame is good. If not, likely a programmer error
    if df.empty:
        return "No data to visualize. Check your input data and try again"

    # Select time range
    if (start != None) and (end == None):
        df = get_time_frame_from_df(df, start, "3000")
    elif (start == None) and (end != None):
        df = get_time_frame_from_df(df, "2020", end)
    elif (start != None) and (end != None):
        df = get_time_frame_from_df(df, start, end)
    else:
        df = df.copy()
        
    # Check if the time range returns no data. If not, likely a user error
    if df.empty:
        return "No data to visualize. Check your time range and try again"

    if not selected_state:
        # National level: group by state
        group_col = "State"
        group_col_plural = "States"
        scope_name = "USA"
    else:
        # State level: group by county
        group_col = "County"
        group_col_plural = "Counties"
        scope_name = selected_state.title()
        df = df[df["State"].str.title() == scope_name]

    # Group by Flock Type and calculate percentage
    grouped = df["Flock Type"].value_counts().reset_index()
    grouped.columns = ["Flock Type", "Count"]
    grouped["Flock (%)"] = (grouped["Count"] / grouped["Count"].sum() * 100).round(3)
    
    # Slice
    if show_top_n is not None:
        grouped = grouped.head(int(show_top_n))

    if not title:
        title = f"Affected Flock Type - {title_picker(df)}"
        if start or end:
            date_range = f"{start or '02/08/2022'} to {end or 'Present'}"
            title = f"{title} ({date_range})"

    # Create pie chart
    fig = px.pie(
        grouped,
        names="Flock Type",
        values="Count",
        title=title,
        hover_data=["Flock (%)"],
    )
    fig.update_traces(
        textinfo="none",  # Removes text labels from pie slices
        hovertemplate="%{label}<br>Count: %{value}<br>Percentage: %{customdata[0]}%",  # Custom hover
        customdata=grouped[["Flock (%)"]],  # Pass percentage to hovertemplate
    )

    # Set figure size
    fig.update_layout(
        title_x=0.5,
        # width=450,
        # height=450,
        template="plotly_white",
        legend = dict(
            font = dict(size=5)  # adjust to fit your layout
            )
    )
    # Splits the title if there is a (, which only happens when there's a time range
    if (title.find("(") > 0):
        index = title.find("(")
        title = title[:index] + '<br>' + title[index :]
        fig.update_layout(
            title = dict(
                text = title,
                x = 0.50001,
                y = 0.95,
                font = dict(
                    size = 12
                    )
                )
            )
    
    # Save to HTML
    # fig.write_html(f"{output_file}", config=config)
    # print(f"Plot saved to {output_file}")
    return fig

# Bar graph showing summed outbreaks over time
def get_vertical_outbreaks_over_time(df, title=None, start=None, end=None, selected_state=None, selected_county=None, **kwargs):
    output_file = kwargs.get("output_file", "vbar_outbreaks_over_time.html")
    
    # Check if data frame is good. If not, likely a programmer error
    if df.empty:
        print("No data to visualize. Check your input data and try again")
        return
    
    # Prevent incomplete method call (if county, require state)
    if selected_county and not selected_state:
        sys.exit("You must provide a state if you select a county")
    
    # Check if the time range returns no data. If not, likely a user error
    if df.empty:
        return "No data to visualize. Check your time range and try again"
    
    # Select scope
    if selected_county: # COUNTY LEVEL
        scope = f"{selected_county.title()}, {selected_state.title()}"
        title = build_title_vbar(scope=scope, start=start, end=end)
        df = df[(df["County"].str.title() == selected_county.title()) & (df["State"].str.title() == selected_state.title())]
    elif selected_state: # STATE LEVEL
        scope = f"{selected_state.title()}"
        title = build_title_vbar(scope=scope, start=start, end=end)
        df = df[df["State"].str.title() == selected_state.title()]
    else:
        scope = "USA"
        title = build_title_vbar(scope=scope, start=start, end=end)

    # Select time range
    if (start != None) and (end == None):
        df = get_time_frame_from_df(df, start, "3000")
    elif (start == None) and (end != None):
        df = get_time_frame_from_df(df, "2020", end)
    elif (start != None) and (end != None):
        df = get_time_frame_from_df(df, start, end)
    else:
        df = df.copy()

    # Filter by state if provided
    if selected_state:
        df = df[df["State"].str.title() == selected_state.title()]
        # Filter by county if provided and state is selected
        if selected_county:
            df = df[df["County"].str.title() == selected_county.title()]

    df["Outbreak Date"] = pd.to_datetime(df["Outbreak Date"])
    
    grouped = df.groupby("Outbreak Date", as_index=False)["Flock Size"].sum()

    fig = px.bar(
        grouped,
        x="Outbreak Date",
        y="Flock Size",
        title=title,
        labels={"Outbreak Date": "Outbreak Date", "Outbreak Size": "Outbreak Size"},
        color_discrete_sequence=["dodgerblue"]
    )

    # Tooltip formatting (optional customization)
    fig.update_traces(
        marker=dict(color='blue', line=dict(width=1, color='black')),
        hovertemplate="Date: %{x|%m/%d/%Y}<br>Size: %{y:,}",
        width=24*60*60*1000
    )

    # Improve layout
    fig.update_layout(
        xaxis_title="Outbreak Date",
        yaxis_title="Outbreak Size",
        title_x=0.5,
        hoverlabel=dict(bgcolor="white", font_size=12),
        template="plotly_white",
        dragmode="pan",
        bargap=0.2
    )
    # Splits the title if there is a (, which only happens when there's a time range
    if (title.find("(") > 0):
        index = title.find("(")
        title = title[:index] + '<br>' + title[index :]
        fig.update_layout(
            title = dict(
                text = title,
                x = 0.50001,
                y = 0.95,
                font = dict(
                    size = 11
                    )
                )
            )
    
    return fig

# Line graph showing summed outbreaks over time (DEPRECATED; opt for vertical bar graph each time to accurately show gaps)
def line_graph_maker(df, start=None, end=None, title=None, output_file="line_outbreaks_over_time.html"):
        # Check if data frame is good. If not, likely a programmer error
    if df.empty:
        return "No data to visualize. Check your input data and try again"

    # Select time range
    if (start != None) and (end == None):
        df = get_time_frame_from_df(df, start, "3000")
    elif (start == None) and (end != None):
        df = get_time_frame_from_df(df, "2020", end)
    elif (start != None) and (end != None):
        df = get_time_frame_from_df(df, start, end)
    else:
        df = df.copy()
        
    # Check if the time range returns no data. If not, likely a user error
    if df.empty:
        return "No data to visualize. Check your time range and try again"
    
    df["Outbreak Date"] = pd.to_datetime(df["Outbreak Date"])
    
    grouped = df.groupby("Outbreak Date", as_index=False)["Flock Size"].sum()
    
    # Title fallback
    if not title:
        title = f"Outbreak History - " + title_picker(df)

    fig = px.line(
        grouped,
        x="Outbreak Date",
        y="Flock Size",
        title=title,
        markers=True,
        labels={"Outbreak Date": "Outbreak Date", "Outbreak Size": "Outbreak Size"},
        color_discrete_sequence=["dodgerblue"]
    )

    # Tooltip formatting (optional customization)
    fig.update_traces(
        marker=dict(size=6, color='blue', line=dict(width=1, color='black')),
        hovertemplate="Date: %{x|%m/%d/%Y}<br>Size: %{y:,}"
    )

    # Improve layout
    fig.update_layout(
        xaxis_title="Outbreak Date",
        yaxis_title="Outbreak Size",
        title_x=0.5,
        hoverlabel=dict(bgcolor="white", font_size=12),
        template="plotly_white",
        dragmode="pan"
    )
    # Splits the title if there is a (, which only happens when there's a time range
    if (title.find("(") > 0):
        index = title.find("(")
        title = title[:index] + '<br>' + title[index :]
        fig.update_layout(
            title = dict(
                text = title,
                x = 0.50001,
                y = 0.95,
                font = dict(
                    size = 11
                    )
                )
            )

    # Save to HTML
    # fig.write_html(output_file, config=config)
    # print(f"Plot saved to {output_file}")
    return fig

# Helper to dynamically build titles
def build_title(prefix, group_col, group_col_plural, scope_name, show_top_n=None, start=None, end=None):
    title_parts = []
    if show_top_n is not None:
        title_parts.append(f"Top {show_top_n} {group_col_plural}")
    title_parts.append(f"{prefix} by {group_col} - {scope_name}")
    if start or end:
        date_range = f"{start or '02/08/2022'} to {end or 'Present'}"
        finished_title = " - ".join(title_parts)
        return f"{finished_title} ({date_range})"
    return " - ".join(title_parts)

# Helper to build titles IN FORMAT ONLY APPROPRIATE FOR VBAR
def build_title_vbar(scope, start=None, end=None):
    title_parts = []
    title_parts.append(f"Outbreak History - {scope}")
    if start or end:
        date_range = f"{start or '02/08/2022'} to {end or 'Present'}"
        finished_title = " - ".join(title_parts)
        return f"{finished_title} ({date_range})"
    return " - ".join(title_parts)

# Another helper method to dynamically build titles. Only used by line graph
def title_picker(frame):
    if len(frame) > 0:
        # Fill NA values with "Unknown" before getting unique values
        frame = frame.copy()
        frame["State"] = frame["State"].fillna("Unknown")
        frame["County"] = frame["County"].fillna("Unknown")
        
        unique_states = frame["State"].unique()
        unique_counties = frame["County"].unique()

        # If we have exactly one state and one county (excluding Unknown)
        if len(unique_states) == 1 and len(unique_counties) == 1:
            state = unique_states[0]
            county = unique_counties[0]
            if state != "Unknown" and county != "Unknown":
                title_suffix = f"{county}, {state}"
            elif state != "Unknown":
                title_suffix = state
            else:
                title_suffix = "USA"
        # If we have exactly one state (excluding Unknown)
        elif len(unique_states) == 1 and unique_states[0] != "Unknown":
            title_suffix = unique_states[0]
        else:
            title_suffix = "USA"
    else:
        title_suffix = "Unknown Region"
    return title_suffix


#------------------------------------------- Method Testing -----------------------------------------#
if __name__ == "__main__":
    get_horizontal_comparison_flock_sizes(df).show()
    # get_horizontal_comparison_flock_sizes(df, show_top_n=10).show()
    # get_horizontal_comparison_flock_sizes(df, selected_state="Georgia").show()
    # get_horizontal_comparison_flock_sizes(df, selected_state="Georgia", show_top_n=10).show()
    # get_horizontal_comparison_flock_sizes(df, selected_state="Georgia", show_top_n=10, start="01/01/2025", end="04/01/2025").show()
    # get_horizontal_comparison_flock_sizes(df, start="2000", end="2001").show() # Should return no data
    # get_horizontal_comparison_flock_sizes(df, start="2024").show()
    # get_horizontal_comparison_flock_sizes(df, end="2023").show()
    

    # get_horizontal_comparison_frequencies(df).show()
    # get_horizontal_comparison_frequencies(df, show_top_n=10).show()
    # get_horizontal_comparison_frequencies(df, selected_state="Georgia").show()
    # get_horizontal_comparison_frequencies(df, selected_state="Georgia", show_top_n=10).show()
    # get_horizontal_comparison_frequencies(df, start="2000", end="2001").show() # Should return no data
    # get_horizontal_comparison_frequencies(df, start="2024").show()
    # get_horizontal_comparison_frequencies(df, end="2023").show()
    
    # get_horizontal_comparison_flock_types(df).show()
    # get_horizontal_comparison_flock_types(df, show_top_n=10).show()
    # get_horizontal_comparison_flock_types(df, selected_state="Georgia").show()
    # get_horizontal_comparison_flock_types(df, selected_state="Georgia", show_top_n=10).show()
    # get_horizontal_comparison_flock_types(df, start="2000", end="2001").show() # Should return no data
    # get_horizontal_comparison_flock_types(df, start="2024").show()
    # get_horizontal_comparison_flock_types(df, end="2023").show()
    
    # get_pie_flock_sizes(df).show()
    # get_pie_flock_sizes(df, show_top_n=3).show()
    # get_pie_flock_sizes(df, selected_state="Georgia").show()
    # get_pie_flock_sizes(df, selected_state="Georgia", show_top_n=3).show()
    # get_pie_flock_sizes(df, start="2000", end="2001").show() # Should return no data
    # get_pie_flock_sizes(df, start="2024").show()
    # get_pie_flock_sizes(df, end="2023").show()

    # get_pie_frequencies(df).show()
    # get_pie_frequencies(df, show_top_n=3).show()
    # get_pie_frequencies(df, selected_state="Georgia").show()
    # get_pie_frequencies(df, selected_state="Georgia", show_top_n=3).show()
    # get_pie_frequencies(df, start="2000", end="2001").show() # Should return no data
    # get_pie_frequencies(df, start="2024").show()
    # get_pie_frequencies(df, end="2023").show()

    # get_pie_flock_types(df).show()
    # get_pie_flock_types(df, show_top_n=3).show()
    # get_pie_flock_types(df, selected_state="Georgia").show()
    # get_pie_flock_types(df, selected_state="Georgia", show_top_n=3).show()
    # get_pie_flock_types(df, start="2000", end="2001").show() # Should return no data
    # get_pie_flock_types(df, start="2024").show()
    # get_pie_flock_types(df, end="2023").show()
    
    # get_vertical_outbreaks_over_time(df).show()
    # get_vertical_outbreaks_over_time(df, selected_state="Georgia").show()
    # get_vertical_outbreaks_over_time(df, selected_county="Elbert").show() # Should terminate
    # get_vertical_outbreaks_over_time(df, selected_state="Georgia", selected_county="Elbert").show()
    # get_vertical_outbreaks_over_time(df, selected_state="Georgia", selected_county="Elbert", start="01/19/2025").show()
    # get_vertical_outbreaks_over_time(df, selected_state="Georgia", selected_county="Elbert", end="01/19/2025").show()
    # get_vertical_outbreaks_over_time(df, start="01/19/2025", end="04/01/2025").show()
    
    # --- NON-CHART METHOD TESTS ---
    
    # frame = get_time_frame_by_location("2001", "2030")                           # <== National
    # frame = get_time_frame_by_location("2025-01-01", "2025-02-01", "Georgia")    # <== State
    # frame = get_time_frame_by_location("2024", "2030", "ioWA", "BUENA VistA")    # <== County
    # title = f"Outbreaks Over Time - {title_picker(frame)}"
    # summed_frame = sum_by_date(frame)
    # get_vertical_outbreaks_over_time(summed_frame, title=title).show()
    # get_vertical_outbreaks_over_time(frame).show()
    # get_vertical_outbreaks_over_time(filter_by_state("Georgia")).show()
    # # line_graph_maker(summed_frame).show()
    # # line_graph_maker(df).show()
    
    # get_vertical_outbreaks_over_time(df, selected_county="Buena Vista").show()

    # TEST: sum in given time frame
    # frame = get_time_frame_by_location("2025-01-13", "2025-01-14")
    # frame = get_time_frame_by_location("2022-04-19", "2022-04-20")
    # print(sum_by_date(frame))
    # print(frame)