import logging
from pandas import DataFrame
import re
import csv
import json
from faker import Faker
from faker.providers import person
import random
import uuid

fake = Faker()
fake.add_provider(person)

BASE_PATH = "./assets/data/"

gradelist = [
    {"grade": "Minister", "colour": "darkgrey"},
    {"grade": "cab sec", "colour": "darkgrey"},
    {"grade": "SCS4", "colour": "darkgrey"},
    {"grade": "perm sec", "colour": "darkgrey"},
    {"grade": "SCS3", "colour": "indigo"},
    {"grade": "SCS 2", "colour": "navy"},
    {"grade": "SCS2", "colour": "navy"},
    {"grade": "SCS1", "colour": "mediumorchid"},
    {"grade": "DD", "colour": "mediumorchid"},
    {"grade": "G6", "colour": "orchid"},
    {"grade": "G7", "colour": "plum"},
    {"grade": "SEO", "colour": "peachpuff"},
    {"grade": "SEO (TDA)", "colour": "peachpuff"},
    {"grade": "HEO", "colour": "orange"},
    {"grade": "HEO (Fast stream)", "colour": "gold"},
    {"grade": "HEO (Temporary)", "colour": "orange"},
    {"grade": "HEO / FS", "colour": "gold"},
    {"grade": "EO", "colour": "coral"},
    {"grade": "AO", "colour": "coral"},
    {"grade": "TIS3", "colour": "mauve"},
    {"grade": "TIS2", "colour": "peach"},
    {"grade": "TIS1", "colour": "peach"},
    {"grade": "Senior Commercial Specialist (SCS3)", "colour": "crimson"},
    {"grade": "Senior Commercial Specialist", "colour": "crimson"},
    {"grade": "Commercial Specialist (SCS1)", "colour": "crimson"},
    {"grade": "Commercial Specialist", "colour": "crimson"},
    {"grade": "Associate Commercial Specialist", "colour": "salmon"},
    {"grade": "Associate Commercial Specialist (G6)", "colour": "salmon"},
    {"grade": "Assoc Commercial Specialist", "colour": "salmon"},
    {"grade": "Assoc. Commercial Specialist", "colour": "salmon"},
    {"grade": "Commercial Lead", "colour": "salmon"},
    {"grade": "Crown Representative", "colour": "forestgreen"},
    {"grade": "Asst Parliamentary Counsel (APC)", "colour": "forestgreen"},
    {"grade": "APC", "colour": "forestgreen"},
    {"grade": "Colonel", "colour": "green"},
    {"grade": "Military", "colour": "green"},
    {"grade": "Special Adviser", "colour": "lightblue"},
    {"grade": "SPECIAL ADVISOR", "colour": "lightblue"},
    {"grade": "Expert Adviser", "colour": "lightblue"},
    {"grade": "FastStream", "colour": "gold"},
    {"grade": "Fast Streamer", "colour": "gold"},
    {"grade": "Faststreamer (SEO)", "colour": "gold"},
    {"grade": "B2(D) Faststream", "colour": "gold"},
    {"grade": "FastStreamerIn", "colour": "gold"},
    {"grade": "Public Appointment", "colour": "beige"},
    {"grade": "Consultant", "colour": "brown"},
    {"grade": "Contingent Labour", "colour": "brown"},
    {"grade": "Contractor", "colour": "brown"},
    {"grade": "Contingent", "colour": "brown"},
    {"grade": "0", "colour": "grey"},
    {"grade": "N/A", "colour": "grey"},
    {"grade": "", "colour": "grey"},
    {"grade": "TBC", "colour": "grey"},
]


def generate_fake_org_data():
    cs_gradelist_subset = [
        "Perm Sec",
        "SCS4",
        "SCS3",
        "SCS2",
        "SCS1",
        "DD",
        "G6",
        "G7",
        "SEO",
        "SEO",
        "HEO",
        "EO",
        "AO",
    ]

    p_gradelist_subset = [
        "Minister",
    ] + ["Special Advisor" for _ in range(5)]

    rows = []
    idx = 0
    previous_level = []
    for grade_list in (cs_gradelist_subset, p_gradelist_subset):
        for grade_number, grade in enumerate(grade_list):
            number_of_rows = (grade_number + 1) ** 2
            current_level = generate_current_grade_level(
                grade, number_of_rows, previous_level, idx
            )
            idx += number_of_rows
            rows.extend(current_level)
            previous_level = current_level

    return rows


def generate_current_grade_level(grade, number_of_rows, previous_level, idx):
    rows = []
    for _ in range(number_of_rows):
        if grade == "Perm Sec":
            lm_position_id = "TopCS"
        elif grade == "Minister":
            lm_position_id = "TopP"
        else:
            lm_position_id = random.choice(previous_level)["Position_ID"]

        rows.append(
            {
                "Business_Unit": "Example Unit",
                "Sub_Unit": "Example Sub Team",
                "Team": "Example team",
                "Position_ID": "Pos" + str(uuid.uuid4()),
                "LM_Position_ID": lm_position_id,
                "Position_Title": f"Position {idx}",
                "Name": fake.first_name(),
                "Surname": fake.last_name(),
                "Grade": grade,
                "imgUrl": None,
                "profileUrl": None,
                "summary": None,
                "profession": None,
                "email": None,
                "_id": idx,
            }
        )
    return rows


def import_file(
    file_name: str,
) -> DataFrame:
    with open(BASE_PATH + file_name, mode="r", encoding="utf-8-sig") as f:
        csv_reader = csv.DictReader(f)
        return tuple(csv_reader)


def write_json(data: dict, file_name: str):
    with open(BASE_PATH + file_name, "w") as f:
        json.dump(data, f, indent=2)


def handler(*args):
    logging.info("Pipeline started")

    # input
    skills_name = "skills_fake.csv"

    # output
    csfile = "cs_json.json"
    pfile = "p_json.json"
    tfile = "teams.json"

    team_list = []
    team_dictionary = []

    skills_data = import_file(skills_name)

    # Replace this with real org_data
    # org_data = import_file(path_to_org_data_file)
    org_data = generate_fake_org_data()

    for el in org_data:
        if el["Sub_Unit"] == "":
            el["Sub_Unit"] = el["Business_Unit"]
        if el["Team"] == "":
            el["Team"] = el["Sub_Unit"]
        if el["Surname"] != "":
            el["Name"] = el["Name"] + " " + el["Surname"]
        match = next(g for g in gradelist if g["grade"].lower() == el["Grade"].lower())
        el["colour"] = match["colour"]
        sk = [item for item in skills_data if item["UserID"] == el["_id"]]
        if len(sk) > 0:
            el["skills"] = [item["Skill"] for item in sk]
        else:
            el["skills"] = ""

        # store teams data
        team = re.sub(
            "[^a-zA-Z0-9\n\.]",
            "_",
            (el["Team"] + el["Sub_Unit"] + el["Business_Unit"]),
        ).lower()
        if not team in team_list:
            team_list.append(team)
            team_dictionary.append(
                {
                    "tag": team,
                    "team": el["Team"],
                    "business_unit": el["Business_Unit"],
                    "sub_unit": el["Sub_Unit"],
                }
            )

    def get_children(manager_id):
        els = [el for el in org_data if el["LM_Position_ID"].strip() == manager_id]
        for el in els:
            children = get_children(el["Position_ID"].strip())
            c = tuple(children)
            if len(c) > 0:
                el["children"] = c
            yield el

    # write CS
    data = list(tuple(get_children("TopCS")))
    write_json(data[0], csfile)

    # write political
    data = list(tuple(get_children("TopP")))

    write_json(data[0], pfile)

    # write teams
    teamdata = json.dumps(team_dictionary)
    write_json(teamdata, tfile)


if __name__ == "__main__":
    handler()
